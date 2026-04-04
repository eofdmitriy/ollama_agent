<?php

namespace App\Events;

use App\Models\Document;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Document $document)
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.kb'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->document->id,
            'status' => $this->document->status,
            'title' => $this->document->title,
            'error_message' => $this->document->error_message,
            'updated_at' => $this->document->updated_at->toDateTimeString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'DocumentStatusUpdated';
    }
}
