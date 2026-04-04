<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'title', 'category', 'file_path', 'status', 'error_message'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(KnowledgeBase::class);
    }

    protected static function booted()
    {
        // При Soft Delete документа -> Soft Delete всех его чанков
        static::deleted(function ($document) {
            $document->chunks()->delete();
        });

        // При восстановлении документа -> восстановление чанков
        static::restored(function ($document) {
            $document->chunks()->restore();
        });
    }
}
