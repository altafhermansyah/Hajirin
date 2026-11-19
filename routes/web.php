<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminEventController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Eo\EoAttendeeController;
use App\Http\Controllers\Eo\EoCheckInController;
use App\Http\Controllers\Eo\EoDashboardController;
use App\Http\Controllers\Eo\EoEventController;
use App\Http\Controllers\Eo\EoProfileController;
use App\Http\Controllers\EoApplicationController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\UserProfileController;
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
    Route::put('/profile', [UserProfileController::class, 'update'])->name('profile.update');
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

    Route::get('/check-in', [EoCheckInController::class, 'index'])->name('check-in.index');
    Route::post('/check-in', [EoCheckInController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('check-in.store');

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

    // Kelola Pengguna (User Management)
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::put('/users/{id}', [AdminUserController::class, 'update'])->name('users.update');
    Route::patch('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');
});

// Route Autentikasi (Guest)
Route::middleware(['guest', 'throttle:5,1'])->group(function () {
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
});

// Route Keluar Akun (Logout)
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
