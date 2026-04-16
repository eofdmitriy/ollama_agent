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
use Illuminate\Support\Arr; 

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

        // Логика сбоя
        if (str_contains($lowerPrompt, 'сломайся')) {
            Cache::put($this->cacheKey, 'down', 10);
            throw new Exception("Критический сбой Ollama: соединение потеряно (MOCK).");
        }

        if (str_contains($lowerPrompt, 'починись')) {
            Cache::forget($this->cacheKey);
            return "Система восстановлена через Prism Fake!";
        }

        if (Cache::get($this->cacheKey) === 'down') {
            throw new Exception("Ollama Offline: Сервис находится в режиме сбоя.");
        }

        // Варианты ответов разной длины
        $responses = [
            "Принято! Обрабатываю ваш запрос.",
            "Я проанализировал ваш промпт '{$prompt}' и считаю, что это интересная задача для нейросети.",
            "В рамках текущей симуляции (Prism Fake) я имитирую работу модели {$this->model}. Ваш системный промпт был: " . ($system ?: 'пустой') . ".\nВсе системы работают в штатном режиме.",
            "[MOCK_DATA] Status: 200. Tokens: 42. Logic: Success. Prompt_Length: " . strlen($prompt),
            "Представьте, что здесь очень умный ответ от Ollama, который помогает вам решить все проблемы за один клик!"
        ];

        $randomText = Arr::random($responses);

        // Подменяем ответ в Prism
        Prism::fake([
            new Response(
                steps: new Collection(),
                text: $randomText,
                finishReason: FinishReason::Stop,
                toolCalls: [],
                toolResults: [],
                usage: new Usage(15, 35), 
                meta: new Meta(id: 'mock-' . uniqid(), model: $this->model), 
                messages: new Collection(),
                additionalContent: [],
                raw: []
            )
        ]);

        // Имитируем задержку "раздумий" ИИ
        sleep(1); 
        
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

        sleep(1); 

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