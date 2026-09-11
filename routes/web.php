<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LoyaltyController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MerchantController;
use App\Http\Controllers\StorefrontController;
use App\Models\Store;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing', ['demoAvailable' => Store::where('slug', 'dar')->where('is_published', true)->exists()]);
});

Route::get('/s/{store}', [StorefrontController::class, 'show'])->name('storefront');
Route::post('/s/{store}/checkout', [StorefrontController::class, 'checkout'])->middleware('throttle:10,1')->name('checkout');
Route::get('/orders/confirmation/{token}', [StorefrontController::class, 'confirmation'])->name('order.confirmation');
Route::get('/media/{storeId}/{filename}', [MediaController::class, 'show'])
    ->whereNumber('storeId')->where('filename', '[a-f0-9-]+\.(jpg|jpeg|png|webp)');
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::get('/auth', fn () => redirect('/login'));
    Route::get('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'authenticate'])->middleware('throttle:5,1');
    Route::post('/register', [AuthController::class, 'create'])->middleware('throttle:5,1');
});
Route::middleware('auth')->group(function () {
    Route::get('/customers', [LoyaltyController::class, 'customers'])->name('customers');
    Route::post('/customers', [LoyaltyController::class, 'saveCustomer']);
    Route::get('/customers/{customer}', [LoyaltyController::class, 'customer'])->whereNumber('customer')->name('customers.show');
    Route::put('/customers/{customer}', [LoyaltyController::class, 'saveCustomer'])->whereNumber('customer');
    Route::post('/customers/{customer}/notes', [LoyaltyController::class, 'note'])->whereNumber('customer')->middleware('throttle:30,1');
    Route::post('/customers/{customer}/points', [LoyaltyController::class, 'adjust'])->whereNumber('customer')->middleware('throttle:30,1');
    Route::post('/customers/{customer}/redeem', [LoyaltyController::class, 'redeem'])->whereNumber('customer')->middleware('throttle:30,1');
    Route::get('/rewards', [LoyaltyController::class, 'rewards'])->name('rewards');
    Route::post('/rewards', [LoyaltyController::class, 'saveReward']);
    Route::put('/rewards/{reward}', [LoyaltyController::class, 'saveReward'])->whereNumber('reward');
    Route::post('/media', [MediaController::class, 'upload'])->middleware('throttle:20,1');
    Route::post('/logout', [AuthController::class, 'logout']);
    foreach (['dashboard', 'products', 'orders', 'store'] as $section) {
        Route::get('/'.$section, [MerchantController::class, 'index'])->name($section);
    }
    Route::put('/store', [MerchantController::class, 'updateStore']);
    Route::post('/products', [MerchantController::class, 'saveProduct']);
    Route::put('/products/{product}', [MerchantController::class, 'saveProduct']);
    Route::patch('/orders/{order}', [MerchantController::class, 'updateOrder']);
});
