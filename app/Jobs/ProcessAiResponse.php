<?php

namespace App\Jobs;

use App\Contracts\LlmServiceContract;
use App\Models\Chat;
use App\Models\Message;
use App\Models\KnowledgeBase;
use App\Events\MessageSent;
use App\Events\ChatUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Pgvector\Laravel\Vector;
use Pgvector\Laravel\Distance;
use Exception;

class ProcessAiResponse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900;

    public function __construct(protected Chat $chat, protected string $userText, protected Message $message) {}

    public function handle(LlmServiceContract $ai)
    {
        try {
            set_time_limit(850); 

            Log::info("AI Job Started", ['chat_id' => $this->chat->id, 'user_text_len' => mb_strlen($this->userText)]);

            $safeUserText = mb_substr($this->userText, 0, 1500);

            // Векторизация вопроса
            $queryVector = new Vector($ai->getEmbedding($safeUserText));

             $this->message->updateQuietly(['embedding' => $queryVector]);

            // Анализ намерения
            $rawIntent = $ai->generate(
                "Вопрос: '{$safeUserText}'. О каком времени речь? Сегодня: " . now()->format('Y-m-d') . ". Ответь ТОЛЬКО: YYYY-MM-DD или 'current'.",
                "Ты — строгий классификатор даты. Не пиши пояснений."
            );

            Log::debug("AI Intent Raw Response", ['raw' => $rawIntent]);

            $intent = 'current';
            if (preg_match('/\d{4}-\d{2}-\d{2}/', $rawIntent, $matches)) {
                $intent = $matches[0];
            } elseif (preg_match('/\bcurrent\b/i', $rawIntent)) {
                $intent = 'current';
            }

            // Сборка сырого КОНТЕКСТА
            $contextData = $this->getCombinedContext($queryVector, $intent);
            
            // ПРИМЕНЯЕМ УМНУЮ ОБРЕЗКУ 
            $smartContent = $this->getSmartPrompt($contextData, $safeUserText);

            $this->logRagSearch($intent, $contextData['sources'], mb_strlen($smartContent));

            $hasKnowledge = !empty($contextData['kb']);

            $systemPrompt = "Ты корпоративный ассистент. Отвечай кратко. ";
            $systemPrompt .= "Используй только предоставленный контекст. Если в контексте нет ответа, так и скажи, не придумывай факты.\n\n";
            
            if (!$hasKnowledge) {
                $systemPrompt .= "ПРЕДУПРЕЖДЕНИЕ: В базе знаний подходящих данных не найдено. Отвечай на основе истории диалога или общих знаний, но уточни, что в документах этого нет.\n\n";
            }

            $systemPrompt .= $smartContent;

            // Генерация основного ответа
            $aiResponse = $ai->generate($safeUserText, $systemPrompt);

            // Сохранение ответа и его вектора
            $aiMsg = $this->chat->messages()->create([
                'role' => 'assistant',
                'content' => $aiResponse,
                'embedding' => new Vector($ai->getEmbedding($aiResponse)),
            ]);

            broadcast(new MessageSent($aiMsg));

            if (trim($this->chat->title) === 'Новый чат') {
                $this->updateTitle($safeUserText, $ai);
            }

            Log::info("AI Job Finished Successfully", ['chat_id' => $this->chat->id]);

        } catch (Exception $e) {
           Log::error("AI Job Critical Failure", [
                'chat_id' => $this->chat->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() 
            ]);
            broadcast(new MessageSent($this->chat->messages()->create([
                'role' => 'system', 'content' => 'Ошибка обработки запроса ИИ'
            ])));
        }
    }

    protected function getCombinedContext(Vector $vector, string $intent): array
    {
        $sources = [];

        // 1. СНАЧАЛА берем КОРОТКУЮ ПАМЯТЬ
        $recent = Message::where('chat_id', $this->chat->id)
            ->where('id', '<', $this->message->id)
            ->orderBy('id', 'desc')
            ->limit(4)
            ->get(); 

        $excludeIds = $recent->pluck('id')->push($this->message->id);

        // 3. ДЛИННАЯ ПАМЯТЬ 
        $archivedMsgs = Message::where('chat_id', $this->chat->id)
            ->whereNotIn('id', $excludeIds)
            ->whereNotNull('embedding')
            ->nearestNeighbors('embedding', $vector, Distance::Cosine)
            ->whereRaw("(1 - (embedding <=> ?)) > 0.75", [$vector])
            ->limit(2)
            ->get();
        
        $sources['history'] = $archivedMsgs->pluck('id')->toArray();

        // 4. БАЗА ЗНАНИЙ 
        $kbChunks = KnowledgeBase::query()
            ->nearestNeighbors('embedding', $vector, Distance::Cosine)
            ->whereRaw("(1 - (embedding <=> ?)) > 0.7", [$vector])
            ->when($intent === 'current', fn($q) => $q->where('is_current', true))
            ->when($intent !== 'current', fn($q) => 
                $q->where('valid_from', '<=', $intent)
                ->where(fn($sub) => $sub->where('valid_to', '>=', $intent)->orWhereNull('valid_to'))
            )
            ->limit(3)->get();

        if ($kbChunks->isEmpty()) {
            Log::info("RAG: База знаний не дала результатов по этому запросу.", ['chat_id' => $this->chat->id]);
        }

        $sources['kb'] = $kbChunks->pluck('document.title')->toArray();

        return [
            'kb'         => $kbChunks->map(fn($m) => $this->cleanText($m->content))->implode("\n---\n"),
            'long_term'  => $archivedMsgs->map(fn($m) => $this->cleanText($m->content))->implode("\n---\n"),
            'short_term' => $recent->reverse()->map(fn($m) => "{$m->role}: " . $this->cleanText($m->content))->implode("\n"),
            'sources'    => $sources
        ];
    }


    /**
     * Динамическое управление контекстным окном (4096 токенов ~ 10-12к символов)
     */
    protected function getSmartPrompt(array $contextData, string $userText): string
    {
        $maxChars = 10000; 
        
        $kb = "### БАЗА ЗНАНИЙ:\n" . $contextData['kb'];
        $long = "\n### КОНТЕКСТ ПРОШЛОГО:\n" . $contextData['long_term'];
        $short = "\n### ТЕКУЩИЙ ДИАЛОГ:\n" . $contextData['short_term'];
        $q = "\nВопрос: " . $userText;

        // Приоритет 1: Все влезает
        if (mb_strlen($kb . $long . $short . $q) <= $maxChars) {
            return $kb . $long . $short . $q;
        }

        // Приоритет 2: Жертвуем архивными сообщениями (Long-term)
        $long = "";
        if (mb_strlen($kb . $short . $q) <= $maxChars) return $kb . $short . $q;

        // Приоритет 3: Сокращаем текущий диалог (Short-term) до хвоста в 1500 символов
        $short = "\n\n### ТЕКУЩИЙ ДИАЛОГ (фрагмент):\n..." . mb_substr($short, -1500);
        if (mb_strlen($kb . $short . $q) <= $maxChars) return $kb . $short . $q;

        // Приоритет 4: Если совсем беда — режем базу знаний до 4000 символов
        $kb = mb_substr($kb, 0, 4000) . "\n...[данные базы обрезаны]";
        
        return $kb . $short . $q;
    }

    private function cleanText(string $text): string
    {
        $patterns = ['приветствую', 'здравствуйте', 'привет', 'добрый день', 'добрый вечер', 'доброе утро', 'хай', 'конечно', 'разумеется'];
        $regex = '/\b(' . implode('|', $patterns) . ')\b[[:punct:]\s]*/iu';
        return ltrim(preg_replace($regex, '', $text), " \n\r\t\v\0,.!?-");
    }

    private function logRagSearch(string $intent, array $sources, int $contextLen)
    {
        Log::channel('stack')->info("RAG Search [Chat ID: {$this->chat->id}]", [
            'intent_date' => $intent,
            'kb_documents' => $sources['kb'],
            'history_matches_count' => count($sources['history']),
            'final_prompt_chars' => $contextLen,
        ]);
    }

    private function updateTitle($text, LlmServiceContract $ai)
    {
        $context = Str::limit($text, 100); 
        
        $res = $ai->generateTitle($context);

        if (!empty($res) && $res !== $this->chat->title) {
            $this->chat->update(['title' => $res]); 
            broadcast(new ChatUpdated($this->chat));
        }
    }

}




