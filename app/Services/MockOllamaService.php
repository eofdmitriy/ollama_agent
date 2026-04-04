<?php

namespace App\Services;

use App\Contracts\LlmServiceContract;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Text\Response; 
use Prism\Prism\ValueObjects\Usage;
use Prism\Prism\ValueObjects\Meta;
use Prism\Prism\Enums\FinishReason;

class MockOllamaService implements LlmServiceContract
{
    private string $cacheKey = 'mock_ollama_status_state';
    private string $model;

    public function __construct() {
        $this->model = config('services.ollama.model');
    }


    public function generate(string $prompt, string $system = ''): string
    {
        $lowerPrompt = mb_strtolower($prompt);

        if (str_contains($lowerPrompt, 'сломайся')) {
            Cache::put($this->cacheKey, 'down', 60);
            throw new Exception("Критический сбой Ollama: соединение потеряно (MOCK).");
        }

        if (str_contains($lowerPrompt, 'починись')) {
            Cache::forget($this->cacheKey);
            return "Система восстановлена через Prism Fake!";
        }

        if (Cache::get($this->cacheKey) === 'down') {
            throw new Exception("Ollama Offline: Сервис находится в режиме сбоя.");
        }

        Prism::fake([
            new Response(
                steps: new Collection(),
                text: "MOCK-PRISM: Ответ на '{$prompt}'. Контекст: " . ($system ?: 'нет'),
                finishReason: FinishReason::Stop,
                toolCalls: [],
                toolResults: [],
                usage: new Usage(10, 20), 
                meta: new Meta(id: 'mock-id', model: 'mock-model'), 
                messages: new Collection(),
                additionalContent: [],
                raw: []
            )
        ]);

        return Prism::text()
            ->using(Provider::Ollama, $this->model)
            ->withPrompt($prompt)
            ->generate()
            ->text;
    }

    public function generateTitle(string $text): string
    {
        $mockTitle = "Заголовок: " . Str::limit($text, 20);

        Prism::fake([
            new Response(
                steps: new Collection(),
                text: $mockTitle,
                finishReason: FinishReason::Stop,
                toolCalls: [],
                toolResults: [],
                usage: new Usage(5, 10),
                meta: new Meta(id: 'mock-id', model: 'mock-model'),
                messages: new Collection(),
                additionalContent: [],
                raw: []
            )
        ]);

        return Prism::text()
            ->using(Provider::Ollama, 'mock')
            ->withPrompt($text)
            ->generate()
            ->text;
    }

    public function getEmbedding(string $text): array
    {
        return array_map(fn() => rand(-100, 100) / 100, range(1, 768));
    }

    public function checkStatus(): array
    {
        if (Cache::get($this->cacheKey) === 'down') {
            return ['status' => 'down', 'error' => 'Offline по команде пользователя'];
        }
        return ['status' => 'online', 'model' => 'prism-mock-llama'];
    }
}