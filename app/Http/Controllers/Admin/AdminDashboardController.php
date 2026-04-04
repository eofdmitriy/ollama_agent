<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Chat;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AdminDashboardController extends Controller
{

    public function usersIndex(Request $request)
    {
        return Inertia::render('admin/users/Index', [
            'users' => User::query()
                ->withTrashed() // <--- Добавляем это: тянет и живых, и удаленных
                ->when($request->search, function($q, $s) {
                    $q->where(function($query) use ($s) { 
                        $query->where('name', 'like', "%$s%")
                            ->orWhere('email', 'like', "%$s%");
                    });
                })
                ->select(['id', 'name', 'email', 'avatar','role', 'created_at', 'deleted_at']) 
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => $request->only(['search']) 
        ]);
    }

    public function userDestroy(User $user)
    {
        $user->forceDelete(); 
        return back()->with('success', 'Пользователь удален навсегда');
    }

    public function userUpdate(Request $request, User $user)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|max:2048|mimes:jpg,jpeg,png,webp',
            'delete_avatar' => 'nullable|boolean', 
            'role' => 'nullable|in:admin,user',
        ];

        $messages = [
            'name.required' => 'Укажите имя пользователя',
            'name.max' => 'Имя слишком длинное (максимум 255 символов)',
            'email.required' => 'Email обязателен для заполнения',
            'email.email' => 'Введите корректный адрес почты',
            'email.unique' => 'Этот email уже занят другим пользователем',
            'avatar.image' => 'Файл должен быть изображением',
            'avatar.max' => 'Размер фото не должен превышать 2 МБ',
            'avatar.mimes' => 'Допустимые форматы: JPG, PNG, WEBP',
            'role.in' => 'Выбрана недопустимая роль',
        ];

        $validated = $request->validate($rules, $messages);

        // 1. Логика удаления по флагу (если не прислан новый файл)
        if ($request->delete_avatar && !$request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
                $user->avatar = null; 
            }
        }

        // 2. Логика загрузки нового файла
        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        // 3. Обновляем остальные поля и сохраняем
        $user->name = $validated['name'];
        $user->email = $validated['email'];

         if ($request->has('role') && auth()->id() === 1 && $user->id !== 1) {
            $user->role = $request->role;
        }
        $user->save();

        return back()->with('success', 'Данные пользователя успешно обновлены');
    }



     public function userChats(Request $request, User $user)
    {
        $chats = $user->chats()
            ->withTrashed()
            ->withCount(['messages' => fn($q) => $q->withTrashed()])
            ->when($request->search, fn($q, $s) => $q->where('title', 'like', "%$s%"))
            ->when($request->date_from, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->date_to, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/users/Chats', [
            'targetUser' => $user->only(['id', 'name']),
            'chats' => $chats,
            'filters' => $request->only(['search', 'date_from', 'date_to']),
        ]);
    }


    public function chatDestroy(Chat $chat)
    {
        $userId = $chat->user_id;
        $chat->forceDelete();

        if (request()->header('Referer') && str_contains(request()->header('Referer'), "/chats/{$chat->id}")) {
            return to_route('admin.users.chats', $userId)->with('success', 'Чат удален');
        }

        return back()->with('success', 'Чат удален');
    }


    public function chatShow(Chat $chat)
    {
        // Загружаем юзера, даже если он удален софтделитом
        $chat->load(['user' => fn($q) => $q->withTrashed()]);

        return Inertia::render('admin/users/ChatShow', [
            'chat' => $chat,
            'messages' => $chat->messages()
                ->withTrashed() // Подтягиваем и удаленные сообщения
                ->oldest()
                ->get(),
        ]);
    }


}
