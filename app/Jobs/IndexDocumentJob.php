<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\KnowledgeBase;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use LLPhant\Embeddings\DataReader\FileDataReader;
use LLPhant\Embeddings\DocumentSplitter\DocumentSplitter;
use LLPhant\Embeddings\EmbeddingGenerator\Ollama\OllamaEmbeddingGenerator; 
use LLPhant\OllamaConfig;
use Pgvector\Laravel\Vector;
use Exception; 
use App\Events\DocumentStatusUpdated;
use Illuminate\Support\Facades\Storage;

class IndexDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Время выполнения. Векторизация через Ollama на CPU 
     * может занимать от 30 сек до нескольких минут на файл.
     */
    public $timeout = 900; 

    public function __construct(
        protected Document $document
    ) {}

    public function handle(): void
    {
        try {
            // 1. Статус
            $this->document->update(['status' => 'processing']);
            broadcast(new DocumentStatusUpdated($this->document));
            Log::info("Job начат для ID: {$this->document->id}");

            // 2. Путь
            if (!Storage::disk('local')->exists($this->document->file_path)) {
                throw new Exception("Файл не найден: " . $this->document->file_path);
            }
            $fullPath = Storage::disk('local')->path($this->document->file_path);

            // 3. Чтение
            $reader = new FileDataReader($fullPath);
            $documents = $reader->getDocuments();
            Log::info("Текст извлечен. Количество страниц/документов: " . count($documents));

            // 4. Ollama
            $config = new OllamaConfig();
            $config->model = 'nomic-embed-text'; 
            $config->baseUrl = str_replace(['/api', '/v1'], '', rtrim(config('services.ollama.url'), '/')) . '/api';
            $generator = new OllamaEmbeddingGenerator($config);

            // --- Предварительная очистка "черновиков", если упал предыдущий Retry ---
            KnowledgeBase::where('document_id', $this->document->id)->where('is_current', false)->delete();

            $hasChunks = false;

            $chunksToInsert = [];

            // 5. Векторизация
            foreach ($documents as $doc) {
                $chunks = DocumentSplitter::splitDocument($doc, 2000, ' ', 100);
                Log::info("Документ нарезан на " . count($chunks) . " чанков.");
                
                foreach ($chunks as $index => $chunk) {
                    $enrichedContent = "Источник: {$this->document->title}. Категория: {$this->document->category}.\nКонтент: " . $chunk->content;
                    
                    Log::info("Отправка чанка {$index} в Ollama...");
                    $embeddingArray = $generator->embedText($enrichedContent);
                    Log::info("Вектор для чанка {$index} получен.");

                    $chunksToInsert[] = [
                        'document_id'     => $this->document->id,
                        'content'         => $enrichedContent,
                        'embedding'       => (string) new Vector($embeddingArray),
                        'embedding_model' => 'nomic-embed-text',
                        'is_current'      => false, 
                        'valid_from'      => now(),
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ];

                    // Вставляем порциями по 50, чтобы экономить память
                    if (count($chunksToInsert) >= 50) {
                        DB::table('knowledge_base')->insert($chunksToInsert);
                        $chunksToInsert = [];
                    }
                    $hasChunks = true;
                }
            }

            if (!empty($chunksToInsert)) {
                DB::table('knowledge_base')->insert($chunksToInsert);
            }

            // 6. Транзакция
            if (!$hasChunks) {
                throw new \Exception("Список чанков для вставки пуст.");
            }

            DB::transaction(function () {
                Log::info("Начало транзакции...");

                // ШАГ А: Гасим старые версии других документов
                DB::table('knowledge_base')
                    ->join('documents', 'knowledge_base.document_id', '=', 'documents.id')
                    ->where('documents.title', $this->document->title)
                    ->where('documents.category', $this->document->category)
                    ->where('knowledge_base.is_current', true)
                    ->where('knowledge_base.document_id', '!=', $this->document->id) 
                    ->update([
                        'knowledge_base.is_current' => false,
                        'knowledge_base.valid_to'   => now()
                    ]);

                // ШАГ Б: Активируем всё, что только что вставили
                KnowledgeBase::where('document_id', $this->document->id)
                    ->where('is_current', false)
                    ->update(['is_current' => true]);

                Log::info("Транзакция завершена успешно.");
            });

            $this->document->update(['status' => 'indexed']);
            broadcast(new DocumentStatusUpdated($this->document));

        } catch (\Exception $e) {
            Log::error("ОШИБКА В JOB: " . $e->getMessage());
            
            // Чистим "черновики" текущей попытки
            KnowledgeBase::where('document_id', $this->document->id)->where('is_current', false)->delete();

            $this->document->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            broadcast(new DocumentStatusUpdated($this->document));
            throw $e;
        }
    }


}

