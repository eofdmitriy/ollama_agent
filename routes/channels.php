<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Chat;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// 1. Канал для сообщений внутри чата (Приватный)
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    // Проверяем, что чат существует и принадлежит именно этому юзеру
    return Chat::where('id', $chatId)
        ->where('user_id', $user->id)
        ->exists();
});

// 2. Личный канал юзера для обновлений заголовков 
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.kb', function ($user) {
    // Только пользователи с ролью admin могут слушать этот канал
    return $user->role === 'admin'; 
});