<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Pgvector\Laravel\HasNeighbors;
use Pgvector\Laravel\Vector;

class KnowledgeBase extends Model
{
    use HasNeighbors, SoftDeletes;

    protected $table = 'knowledge_base';
    
    protected $fillable = [
        'document_id', 'content', 'embedding', 'embedding_model', 
        'is_current', 'valid_from', 'valid_to', 'metadata'
    ];

    protected $casts = [
        'embedding' => Vector::class, 
        'metadata' => 'array',
        'is_current' => 'boolean',
    ];

    protected $hidden = [
        'embedding', // Скрываем вектор от JSON-сериализации
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}
