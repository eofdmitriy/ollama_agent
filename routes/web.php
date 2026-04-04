<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\UserSettingsController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\KnowledgeBaseController;
use App\Http\Controllers\Auth\RestoreAccountController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Features;
use Inertia\Inertia;
use Illuminate\Http\Request;

// 1. Публичная зона (Лендинг)
Route::get('/', function (Request $request) {
    if (Auth::check()) {
        return redirect()->route('chats.index'); 
    }
    return inertia('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'initialIsLogin' => $request->query('action') !== 'register',
    ]);
})->name('home');

// 1.1. Восстановление аккаунта
Route::post('/restore-account', [RestoreAccountController::class, 'restore'])->name('restore.perform');
Route::get('/legal', function () {return Inertia::render('LegalInfo'); })->name('legal');

// 2. Пользовательские роуты
Route::middleware(['auth', 'verified'])->group(function () {
    // Личный кабинет
     Route::prefix('user-settings')->name('my-account.')->controller(UserSettingsController::class)->group(function () {
        Route::get('/', 'show')->name('show');
        Route::patch('/info', 'updateInfo')->name('update-info');
        Route::patch('/password', 'changePassword')->name('password-change');
        Route::delete('/delete', 'deleteAccount')->name('delete-account');
        Route::post('/avatar', 'updateAvatar')->name('avatar-upload');
        Route::delete('/avatar', 'destroyAvatar')->name('avatar-remove');
    });
    // Чаты
    Route::controller(ChatController::class)->prefix('chats')->name('chats.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'storeChat')->name('store');
        Route::get('/{chat}', 'show')->name('show');
        Route::delete('/{chat}', 'destroy')->name('destroy');
        Route::post('/{chat}/messages', 'sendMessage')->name('messages.store');
    });
});


// 3. Админка (Обновленный блок)
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin-panel')->name('admin.')->group(function () {
        
        // Группа для пользователей и чатов 
        Route::controller(AdminDashboardController::class)->group(function () {
            Route::get('/users', 'usersIndex')->name('users.index')->withTrashed();
            Route::patch('/users/{user}', 'userUpdate')->name('users.update')->withTrashed();
            Route::delete('/users/{user}', 'userDestroy')->name('users.destroy')->withTrashed();
            Route::get('/users/{user}/chats', 'userChats')->name('users.chats')->withTrashed();
            Route::delete('/chats/{chat}', 'chatDestroy')->name('chats.destroy')->withTrashed();
            Route::get('/chats/{chat}', 'chatShow')->name('chats.show')->withTrashed();
        });

        // НОВАЯ ГРУППА для Базы Знаний 
        Route::controller(KnowledgeBaseController::class)->prefix('kb')->name('kb.')->group(function () {
            Route::get('/', 'index')->name('index')->withTrashed();
            Route::post('/upload', 'upload')->name('upload');
            Route::delete('/{document}', 'destroy')->name('destroy');
            Route::post('/{id}/restore', 'restore')->name('restore');
            Route::delete('/{id}/force', 'forceDelete')->name('force-delete');
            Route::post('/{document}/retry', 'retry')->name('retry');
            Route::get('/{document}', 'show')->name('show')->withTrashed();
        });
    });
});




require __DIR__.'/settings.php';



