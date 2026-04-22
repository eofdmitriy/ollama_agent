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
    private static ?int $lastUsedIndex = null;

    public function __construct() {
        $this->model = config('services.ollama.model');
    }



    public function generate(string $prompt, string $system = ''): string
    {
        $lowerPrompt = mb_strtolower($prompt);

        // Логика сбоя
        if (Cache::get($this->cacheKey) === 'down') {
            throw new Exception("Ollama Offline (MOCK).");
        }

        $isUserCommand = preg_match('/^вопрос:\s*сломайся/iu', $lowerPrompt) 
                        || $lowerPrompt === 'сломайся';

        if ($isUserCommand) {
            Cache::put($this->cacheKey, 'down', now()->addSeconds(10)); 
            throw new Exception("Критический сбой Ollama: соединение потеряно (MOCK).");
        }

        // Варианты ответов разной длины
       $responses = [
            "Принято! Обрабатываю ваш запрос.",
            "Я проанализировал ваш промпт и считаю, что это интересная задача для нейросети.",
            "[MOCK_DATA] Status: 200. Tokens: 42. Logic: Success. Prompt_Length: " . strlen($prompt),
            "Представьте, что здесь очень умный ответ от Ollama, который помогает вам решить все проблемы за один клик!",
            "Для решения вашей задачи по анализу контекста и интеграции с моделью {$this->model}, я предлагаю следующий алгоритм действий:\n\n1. Проверка входящего потока данных через векторизацию в PGVector.\n2. Семантический поиск по базе знаний (RAG) для извлечения релевантных чанков информации.\n3. Очистка и нормализация полученного контекста для минимизации галлюцинаций.\n4. Генерация финального ответа с учетом истории диалога.\n\nЭтот подход позволяет не только увеличить точность ответов, но и значительно снизить затраты на токены за счет отсечения лишней информации на этапе пре-процессинга. Если у вас возникнут дополнительные вопросы по архитектуре системы, я готов разобрать каждый пункт подробнее!"
        ];


        $availableIndices = array_keys($responses);
        if (self::$lastUsedIndex !== null) {
            $availableIndices = array_diff($availableIndices, [self::$lastUsedIndex]);
        }

        $randomIndex = Arr::random($availableIndices);
        
        self::$lastUsedIndex = $randomIndex;

        $randomText = $responses[$randomIndex];

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
        // sleep(1); 
        
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

        // sleep(1); 

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
        return ['status' => 'online', 'model' => 'prism-mock-ollama'];
    }
}