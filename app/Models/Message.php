<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use App\Contracts\LlmServiceContract;
use Pgvector\Laravel\Vector;
use Pgvector\Laravel\HasNeighbors;

class Message extends Model
{
    use HasFactory, HasNeighbors, SoftDeletes;

    protected $fillable = ['chat_id', 'role', 'content', 'embedding'];

    protected $casts = [
        'embedding' => Vector::class,
    ];

    protected $hidden = [
        'embedding', // Скрываем вектор от JSON-сериализации
    ];

    protected $touches = ['chat']; // Автоматически обновит updated_at у чата


    /**
     * Обратная связь: сообщение принадлежит конкретному чату
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

}
