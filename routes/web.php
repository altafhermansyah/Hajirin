<?php

use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminCheckInController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminEventController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminOrganizerController;
use App\Http\Controllers\Admin\AdminRefundController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Admin\AdminSearchController;
use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Eo\EoAttendeeController;
use App\Http\Controllers\Eo\EoBroadcastController;
use App\Http\Controllers\Eo\EoCheckInController;
use App\Http\Controllers\Eo\EoDashboardController;
use App\Http\Controllers\Eo\EoEventController;
use App\Http\Controllers\Eo\EoProfileController;
use App\Http\Controllers\Eo\EoStaffController;
use App\Http\Controllers\EoApplicationController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\StaffCheckInController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\UserOrderController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\UserTicketController;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route Checkout & Pengajuan EO & Bookmark & Profil (Membutuhkan Login)
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('checkout.store');

    Route::get('/eo-applications/create', [EoApplicationController::class, 'create'])
        ->name('eo-applications.create');
    Route::post('/eo-applications', [EoApplicationController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('eo-applications.store');

    // Route Bookmark Event
    Route::post('/events/{event}/bookmark', [BookmarkController::class, 'toggle'])
        ->name('events.bookmark');
    Route::get('/bookmarks', fn () => redirect()->to(route('dashboard').'#bookmark'))
        ->name('bookmarks');

    // Route Profil User
    Route::get('/profile', [UserProfileController::class, 'show'])->name('profile');
    Route::match(['put', 'post'], '/profile', [UserProfileController::class, 'update'])->name('profile.update');

    // Route Halaman Detail E-Tiket & Scan QR
    Route::get('/my-tickets/{orderReference}', [UserTicketController::class, 'show'])->name('my-tickets.show');

    // Route Halaman Detail Pesanan / Transaksi Invoice & Pengajuan Refund
    Route::get('/orders/{orderReference}', [UserOrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{orderReference}/refund', [UserOrderController::class, 'requestRefund'])
        ->middleware('throttle:5,1')
        ->name('orders.refund.store');

    // Route Notifikasi Pengguna
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');

    // Route Portal Check-in Khusus Staff Event
    Route::prefix('staff')->name('staff.')->group(function () {
        Route::get('/check-in', [StaffCheckInController::class, 'index'])->name('check-in.index');
        Route::post('/check-in', [StaffCheckInController::class, 'store'])
            ->middleware('throttle:60,1')
            ->name('check-in.store');
    });
});

// Route Home (Mengirimkan data categories dan events dari database)
Route::get('/', function () {
    $minPrices = DB::table('ticket_prices')
        ->join('ticket_types', 'ticket_types.id', '=', 'ticket_prices.ticket_type_id')
        ->where('ticket_types.status', 'ACTIVE')
        ->where('ticket_prices.status', 'ACTIVE')
        ->groupBy('ticket_types.event_id')
        ->selectRaw('ticket_types.event_id, MIN(ticket_prices.price) as min_price')
        ->pluck('min_price', 'ticket_types.event_id');

    $events = DB::table('events')
        ->join('categories', 'events.category_id', '=', 'categories.id')
        ->join('users', 'events.eo_id', '=', 'users.id')
        ->where('events.status', 'PUBLISHED')
        ->select(
            'events.id',
            'events.title',
            'events.slug',
            'events.starts_at',
            'events.venue_name',
            'events.event_type',
            'events.banner_path',
            'categories.name as category_name',
            'users.name as organizer_name'
        )
        ->orderBy('events.starts_at')
        ->get()
        ->map(function ($event) use ($minPrices) {
            $minPrice = $minPrices[$event->id] ?? null;
            $numericPrice = $minPrice !== null ? (float) $minPrice : 0;

            return [
                'id' => $event->id,
                'slug' => $event->slug,
                'category' => $event->category_name,
                'title' => $event->title,
                'starts_at' => $event->starts_at,
                'date' => Carbon::parse($event->starts_at)->locale('id')->translatedFormat('D, d M Y • H:i').' WIB',
                'place' => $event->venue_name ?: ($event->event_type === 'ONLINE' ? 'Online Event' : 'Lokasi Diumumkan'),
                'organizer' => $event->organizer_name,
                'price' => $numericPrice > 0 ? 'Rp'.number_format($numericPrice, 0, ',', '.') : 'Gratis',
                'image' => $event->banner_path ?: '/images/events/tech_hero.jpg',
            ];
        });

    $bookmarkedEventIds = auth()->check()
        ? DB::table('bookmarks')->where('user_id', auth()->id())->pluck('event_id')->toArray()
        : [];

    return Inertia::render('Home', [
        'categories' => Category::all(),
        'events' => $events,
        'bookmarkedEventIds' => $bookmarkedEventIds,
    ]);
})->name('home');

// Route Dashboard (Membutuhkan Login)
Route::get('/dashboard', UserDashboardController::class)
    ->middleware('auth')
    ->name('dashboard');

// Route Kategori Dinamis
Route::get('/kategori/{type?}', [CategoryController::class, 'index'])->name('kategori.index');

// Route Detail Event
Route::get('/event/{slug}', [EventController::class, 'show'])->name('event.show');

// Route Event Terdekat
Route::get('/event-terdekat', [EventController::class, 'nearby'])->name('events.nearby');

// Route Halaman Legal Publik (Ketentuan Layanan & Kebijakan Privasi)
Route::get('/syarat-ketentuan', fn () => Inertia::render('Legal/Terms'))->name('legal.terms');
Route::get('/kebijakan-privasi', fn () => Inertia::render('Legal/Privacy'))->name('legal.privacy');

// Route Event Organizer (EO) Dashboard & Manajemen Event/Tiket
Route::middleware(['auth', 'eo'])->prefix('eo')->name('eo.')->group(function () {
    Route::get('/', fn () => redirect()->route('eo.dashboard'));
    Route::get('/dashboard', [EoDashboardController::class, 'index'])->name('dashboard');

    Route::get('/events', [EoEventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EoEventController::class, 'create'])->name('events.create');
    Route::post('/events', [EoEventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit', [EoEventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}', [EoEventController::class, 'update'])->name('events.update');
    Route::post('/events/{id}/submit', [EoEventController::class, 'submitForReview'])->name('events.submit');
    Route::post('/events/{id}/cancel', [EoEventController::class, 'cancel'])->name('events.cancel');

    Route::get('/attendees', [EoAttendeeController::class, 'index'])->name('attendees.index');
    Route::get('/attendees/export', [EoAttendeeController::class, 'export'])->name('attendees.export');
    Route::post('/broadcasts', [EoBroadcastController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('broadcasts.store');

    Route::get('/check-in', [EoCheckInController::class, 'index'])->name('check-in.index');
    Route::post('/check-in', [EoCheckInController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('check-in.store');

    Route::get('/staff', [EoStaffController::class, 'index'])->name('staff.index');
    Route::post('/staff', [EoStaffController::class, 'store'])->name('staff.store');
    Route::delete('/staff/{id}', [EoStaffController::class, 'destroy'])->name('staff.destroy');

    Route::get('/profile', [EoProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [EoProfileController::class, 'update'])->name('profile.update');
});

// Route Admin Dashboard & Moderasi EO + Event
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::post('/eo-applications/{id}/approve', [AdminDashboardController::class, 'approveEoApplication'])
        ->name('eo-applications.approve');
    Route::post('/eo-applications/{id}/reject', [AdminDashboardController::class, 'rejectEoApplication'])
        ->name('eo-applications.reject');

    // Kelola Event Platform
    Route::get('/events', [AdminEventController::class, 'index'])->name('events.index');
    Route::post('/events/{id}/approve', [AdminEventController::class, 'approve'])->name('events.approve');
    Route::post('/events/{id}/reject', [AdminEventController::class, 'reject'])->name('events.reject');
    Route::post('/events/{id}/cancel', [AdminEventController::class, 'cancel'])->name('events.cancel');
    Route::delete('/events/{id}', [AdminEventController::class, 'destroy'])->name('events.destroy');

    // Manajemen Organizer (EO) & Verifikasi Dokumen
    Route::get('/organizers', [AdminOrganizerController::class, 'index'])->name('organizers.index');
    Route::get('/organizers/applications', [AdminOrganizerController::class, 'applications'])->name('organizers.applications');
    Route::get('/verifikasi-eo', fn () => redirect()->route('admin.organizers.applications'))->name('verifikasi-eo');
    Route::get('/organizers/applications/{id}/document', [AdminOrganizerController::class, 'showDocument'])->name('organizers.document');
    Route::post('/organizers/applications/{id}/approve', [AdminOrganizerController::class, 'approveApplication'])->name('organizers.approve');
    Route::post('/organizers/applications/{id}/reject', [AdminOrganizerController::class, 'rejectApplication'])->name('organizers.reject');
    Route::patch('/organizers/{id}/toggle-status', [AdminOrganizerController::class, 'toggleStatus'])->name('organizers.toggle-status');
    Route::post('/organizers/{id}/revoke', [AdminOrganizerController::class, 'revoke'])->name('organizers.revoke');

    // Kelola Kategori Event (Data Master Kategori - Resource Controller)
    Route::resource('categories', AdminCategoryController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Kelola Pengguna (User Management)
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::put('/users/{id}', [AdminUserController::class, 'update'])->name('users.update');
    Route::patch('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');

    // Manajemen Pesanan & Transaksi Tiket
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::patch('/orders/{id}/mark-as-paid', [AdminOrderController::class, 'markAsPaid'])->name('orders.mark-as-paid');

    // Manajemen E-Tiket Individu
    Route::get('/tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
    Route::post('/tickets/{id}/check-in', [AdminTicketController::class, 'checkIn'])->name('tickets.check-in');

    // Manajemen Pengembalian Dana (Refund)
    Route::get('/refunds', [AdminRefundController::class, 'index'])->name('refunds.index');
    Route::post('/refunds/{id}/approve', [AdminRefundController::class, 'approve'])->name('refunds.approve');
    Route::post('/refunds/{id}/reject', [AdminRefundController::class, 'reject'])->name('refunds.reject');

    // Check-in Scanner Platform
    Route::get('/scanner', [AdminCheckInController::class, 'index'])->name('scanner.index');
    Route::post('/scanner', [AdminCheckInController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('scanner.store');
    Route::get('/check-in', fn () => redirect()->route('admin.scanner.index'))->name('check-in');

    // Pencarian Cepat Global Topbar Admin
    Route::get('/search', AdminSearchController::class)->name('search');

    // Laporan & Keuangan Platform (Financial Reporting & Settlements)
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export-pdf', [AdminReportController::class, 'exportPdf'])->name('reports.export-pdf');
});

// Route Autentikasi & Reset Kata Sandi (Guest)
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', [PasswordResetController::class, 'createForgot'])
        ->name('password.request');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'createReset'])
        ->name('password.reset');

    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
        Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
        Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
            ->name('password.email');
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])
            ->name('password.store');
    });
});

// Route Keluar Akun (Logout)
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
