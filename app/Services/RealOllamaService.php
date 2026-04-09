<?php

namespace App\Services;

use App\Contracts\LlmServiceContract;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;
use Prism\Prism\Facades\Prism; 
use Prism\Prism\Enums\Provider;
use LLPhant\OllamaConfig;
use LLPhant\Embeddings\EmbeddingGenerator\Ollama\OllamaEmbeddingGenerator; 
use Illuminate\Support\Str;

class RealOllamaService implements LlmServiceContract
{
    protected string $baseUrl;      
    protected string $apiBaseUrl;   
    protected string $model;
    protected string $embedModel = 'nomic-embed-text';
    protected string $contextSize;
    protected string $threadCount;

    public function __construct() {
        $rawUrl = rtrim(config('services.ollama.url'), '/');
        $this->baseUrl = str_replace(['/api', '/v1'], '', $rawUrl);
        $this->apiBaseUrl = $this->baseUrl . '/api';
        $this->model = config('services.ollama.model');
        $this->contextSize = config('services.ollama.num_ctx');
        $this->threadCount = config('services.ollama.num_thread');
    }

    public function generate(string $prompt, string $system = ''): string
    {
        try {
            $response = Prism::text()
                ->using(Provider::Ollama, $this->model)
                ->withSystemPrompt($system)
                ->withPrompt($prompt)
                ->withClientOptions([
                    'base_url' => $this->baseUrl,
                    'timeout'  => 600
                ]) 
                ->withProviderOptions([
                        'num_ctx'    =>  (int) $this->contextSize,
                        'num_thread' => (int) $this->threadCount,
                    ])
                ->usingTemperature(0.1)
                ->generate();

            return $response->text;
        } catch (Exception $e) {
            Log::error("Ollama Generation Error: " . $e->getMessage(), [
                'model' => $this->model,
                'prompt_limit' => mb_substr($prompt, 0, 100)
            ]);
            throw new Exception("Ollama Error: " . $e->getMessage());
        }
    }

    public function generateTitle(string $userQuestion): string
    {
        try {
            $response = Prism::text()
                ->using(Provider::Ollama, $this->model)
                ->withSystemPrompt("Ты — эксперт по классификации данных. Твоя задача: сформулировать КРАТКУЮ ТЕМУ запроса пользователя на РУССКОМ языке.
                    Правила:
                    1. Максимум 3-4 слова.
                    2. ЗАПРЕЩЕНО ставить знаки препинания в конце (точки, запятые).
                    3. Пиши только СУТЬ (например: 'График отпусков Петрова' или 'Заявление на отпуск').
                    4. Без кавычек и лишних пояснений.")
                ->withPrompt("Определи краткую тему для этого вопроса: " . mb_substr($userQuestion, 0, 1000))
                ->withClientOptions([
                    'base_url' => $this->baseUrl, 
                    'timeout' => 120
                ])
                ->usingTemperature(0.1)
                ->withMaxTokens(40)
                ->usingTopP(0.4)
                ->withProviderOptions([
                    'top_k' => 20,
                ])
                ->generate();

            $title = trim($response->text, " \".\t\n\r\0\x0B");

            // Удаляем любые знаки препинания в самом конце строки
            $title = rtrim($title, ',.!?- ');

            // Страховка: обрезаем до 4 слов, если модель проигнорировала промпт
            $words = explode(' ', $title);
            if (count($words) > 4) {
                $title = implode(' ', array_slice($words, 0, 4));
            }

            return Str::ucfirst($title) ?: 'Новый чат';

        } catch (Exception $e) {
            Log::error("Prism Title Generation Error: " . $e->getMessage());
            return 'Новый чат';
        }
    }

    public function getEmbedding(string $text): array
    {
        try {
            $config = new OllamaConfig();
            $config->model = $this->embedModel; 
            $config->baseUrl = $this->apiBaseUrl; 

            $generator = new OllamaEmbeddingGenerator($config);

            return $generator->embedText($text);
            
        } catch (Exception $e) {
            Log::error("LLPhant Embedding Error: " . $e->getMessage(), ['model' => $this->embedModel]);
            throw new Exception("LLPhant Embedding Error: " . $e->getMessage());
        }
    }

    public function checkStatus(): array
    {
        try {
            $response = Http::timeout(30)->get("{$this->apiBaseUrl}/tags");
            if ($response->successful()) {
                return ['status' => 'online', 'model' => $this->model];
            }
            return ['status' => 'down', 'error' => 'Status: ' . $response->status()];
        } catch (Exception $e) {
            Log::warning("Ollama Connection Lost: " . $e->getMessage());
            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }
}

