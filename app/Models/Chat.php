<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'title', 'model_name'];

    /**
     * Обратная связь: чат принадлежит пользователю
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Прямая связь: чат содержит много сообщений
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    protected static function booted()
    {
        static::deleting(function ($chat) {
            if (!$chat->isForceDeleting()) {
                // Мягко удаляем сообщения этого чата
                $chat->messages()->delete(); 
            }
        });
        
        static::restoring(function ($chat) {
            $deletedAt = $chat->deleted_at;

            // Находим сообщения, удаленные вместе с этим чатом
            $messagesToRestore = $chat->messages()->withTrashed()
                ->whereBetween('deleted_at', [
                    $deletedAt->copy()->subSeconds(5), 
                    $deletedAt->copy()->addSeconds(5)
                ])
                ->get();

            // Восстанавливаем каждое сообщение по отдельности
            $messagesToRestore->each(function ($message) {
                $message->restore();
            });
        });

        static::forceDeleting(function ($chat) {
            // Жестко удаляем все сообщения этого чата
            $chat->messages()->withTrashed()->forceDelete();
        });
    }

}
