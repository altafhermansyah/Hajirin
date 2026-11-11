<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserDashboardController;
use App\Models\Category;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route Checkout (Membutuhkan Login)
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
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

// Route Admin Dashboard
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
});

// Route Autentikasi (Guest)
Route::middleware('guest')->group(function () {
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
});

// Route Keluar Akun (Logout)
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
