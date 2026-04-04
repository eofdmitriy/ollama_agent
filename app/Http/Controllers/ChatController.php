<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Contracts\LlmServiceContract; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use App\Jobs\ProcessAiResponse;


class ChatController extends Controller
{
   public function __construct(
        protected LlmServiceContract $ollama // Просим интерфейс
    ) {}

    /**
     * Точка входа: редирект на создание нового чата.
     */
    public function index()
    {
        return $this->storeChat();
    }

    /**
     * Показать чат.
     */
    public function show(Chat $chat)
    {
        Gate::authorize('view', $chat);

        return Inertia::render('chat/Show', [
            'currentChat' => $chat,
            'messages' => $chat->messages()
                ->get(['id', 'role', 'content', 'created_at']),
            'allChats' => fn () => Auth::user()->chats()
                ->withCount('messages')
                ->latest('updated_at') 
                ->take(15)
                ->get(['id', 'title', 'messages_count']),
            'ollamaStatus' => Inertia::lazy(fn () => $this->ollama->checkStatus()),
        ]);
    }

    /**
     * Создать новый чат.
        */
    public function storeChat()
    {
        Gate::authorize('create', Chat::class);

        $user = Auth::user();

        // 1. Ищем последний созданный чат пользователя
        $lastChat = $user->chats()->latest()->first();

        // 2. Проверяем, пустой ли он (нет сообщений)
        // Предполагаем, что связь в модели User называется chats(), 
        // а в модели Chat есть связь messages()
        if ($lastChat && $lastChat->messages()->count() === 0) {
            // Если сообщений нет, просто "открываем" его заново
            return redirect()->route('chats.show', $lastChat->id);
        }

        // 3. Если чатов нет вообще или последний уже с сообщениями — создаем новый
        $chat = $user->chats()->create([
            'title' => 'Новый чат',
            'model_name' => config('services.ollama.model'),
        ]);

        return redirect()->route('chats.show', $chat->id);
    }


    /**
     * Отправить сообщение.
     */
   public function sendMessage(Request $request, Chat $chat)
    {
        Gate::authorize('update', $chat);
        $request->validate(['content' => 'required|string']);
        $userText = $request->input('content');

        // 1. Сохраняем только юзера (это мгновенно)
        $chat->messages()->create([
            'role' => 'user',
            'content' => $userText,
        ]);

        // 2. Отправляем всё остальное в очередь
        ProcessAiResponse::dispatch($chat, $userText);

        // 3. Возвращаем Inertia-ответ сразу
        return back();
    }


    /**
     * Удалить чат.
     */
    public function destroy(Request $request, Chat $chat)
    {
        Gate::authorize('delete', $chat);
        
        // Запоминаем ID перед удалением
        $deletedId = $chat->id;
        $chat->delete();

        // Проверяем: был ли удален тот чат, который сейчас открыт у пользователя?
        // Мы можем передать текущий ID из фронтенда или проверить URL
        $currentChatId = $request->input('current_chat_id');

        if ($currentChatId && (int)$currentChatId === $deletedId) {
            return $this->storeChat();
        }

        // Если удалили другой чат — просто обновляем данные на текущей странице
        return back();
    }



}


