<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Eo\EoDashboardController;
use App\Http\Controllers\Eo\EoEventController;
use App\Http\Controllers\EoApplicationController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserDashboardController;
use App\Models\Category;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route Checkout & Pengajuan EO (Membutuhkan Login)
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('checkout.store');

    Route::post('/eo-applications', [EoApplicationController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('eo-applications.store');
});

// Route Home (Mengirimkan data categories dari database)
Route::get('/', function () {
    return Inertia::render('Home', [
        'categories' => Category::all(),
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

// Route Event Organizer (EO) Dashboard & Manajemen Event/Tiket
Route::middleware(['auth', 'eo'])->prefix('eo')->name('eo.')->group(function () {
    Route::get('/', fn () => redirect()->route('eo.dashboard'));
    Route::get('/dashboard', [EoDashboardController::class, 'index'])->name('dashboard');

    Route::get('/events/create', [EoEventController::class, 'create'])->name('events.create');
    Route::post('/events', [EoEventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit', [EoEventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}', [EoEventController::class, 'update'])->name('events.update');
    Route::post('/events/{id}/submit', [EoEventController::class, 'submitForReview'])->name('events.submit');
    Route::post('/events/{id}/cancel', [EoEventController::class, 'cancel'])->name('events.cancel');
});

// Route Admin Dashboard & Moderasi EO + Event
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::post('/eo-applications/{id}/approve', [AdminDashboardController::class, 'approveEoApplication'])
        ->name('eo-applications.approve');
    Route::post('/eo-applications/{id}/reject', [AdminDashboardController::class, 'rejectEoApplication'])
        ->name('eo-applications.reject');

    Route::post('/events/{id}/approve', [AdminDashboardController::class, 'approveEvent'])
        ->name('events.approve');
    Route::post('/events/{id}/reject', [AdminDashboardController::class, 'rejectEvent'])
        ->name('events.reject');
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
