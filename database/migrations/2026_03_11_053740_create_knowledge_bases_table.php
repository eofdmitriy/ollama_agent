<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::create('knowledge_base', function (Blueprint $table) {
        $table->id();
        
        // Связь с документом. cascade означает: удалили документ — удалились все его векторы.
        $table->foreignId('document_id')->constrained()->onDelete('cascade');
        
        // Текст фрагмента (обычно 600-800 символов). Именно это мы подставим в промпт ИИ.
        $table->text('content');
        
        // Векторное представление текста. 768 — размерность для nomic-embed-text (Ollama).
        // Именно по этой колонке идет математический поиск "похожести".
        $table->vector('embedding', 768)->nullable();
        
        // Имя модели. Если через год ты сменишь модель на OpenAI (1536 измерений),
        // этот флаг поможет не смешивать старые и новые векторы в одном поиске.
        $table->string('embedding_model')->default('nomic-embed-text');
        
        // Флаг актуальности. Если загрузили новую версию того же документа, 
        // старые чанки получат false и не будут мешать поиску (но останутся для истории).
        $table->boolean('is_current')->default(true)->index();
        
        // Временные рамки. Позволяют реализовать твой запрос: 
        // "Какой был график год назад?" (фильтрация по датам).
        $table->timestamp('valid_from')->useCurrent();
        $table->timestamp('valid_to')->nullable();
        
        // JSON для доп. данных от LLPhant (например, номера страниц PDF или главы).
        $table->json('metadata')->nullable();
        
        // Мягкое удаление самих чанков.
        $table->softDeletes();
        $table->timestamps();
    });

        // Индекс для векторного поиска (HNSW)
        DB::statement('CREATE INDEX kb_embedding_hnsw_idx ON knowledge_base USING hnsw (embedding vector_cosine_ops)');
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_bases');
    }
};
