<?php

namespace App\Events;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [
            // Этот канал для обновления сообщений в открытом чате
            new PrivateChannel('chat.' . $this->message->chat_id),
            
            // Этот канал для сайдбара (индикаторы и сортировка)
            new PrivateChannel('user.' . $this->message->chat->user_id),
        ];
    }

    // Имя события, которое мы будем слушать в JS (.listen('.MessageSent'))
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    // Явно указываем, какие данные шлем (сообщение)
    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}

