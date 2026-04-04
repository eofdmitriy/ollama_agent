<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class RestoreAccountController extends Controller
{
    public function restore()
    {
        $userId = session('restore_user_id');

        if (!$userId) {
            return redirect()->route('login')->withErrors(['email' => 'Сессия истекла.']);
        }

        $user = User::withTrashed()->findOrFail($userId);

        // Восстанавливаем (запустит цепочку в моделях)
        $user->restore();

        // Входим в систему
        Auth::login($user);

        // Очищаем временную метку
        session()->forget('restore_user_id');

        return redirect()->route('chats.index');
    }
}
