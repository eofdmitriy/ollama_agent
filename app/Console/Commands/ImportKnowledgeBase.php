<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use App\Models\User;
use App\Jobs\IndexDocumentJob;
use Illuminate\Support\Str; 
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ImportKnowledgeBase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kb:import {folder=init_kb : Имя папки внутри storage/app/private}';

    /**
     * The console command description.
     *
     * @var string
     */
     protected $description = 'Массовый импорт документов в базу знаний';

    /**
     * Execute the console command.
     */

    // Имя команды для запуска: php artisan kb:import
    

    public function handle()
    {
        $folder = $this->argument('folder'); 
        
        // 1. Физический путь для сканирования (полный путь Windows)
        $fullBasePath = storage_path('app/private/' . $folder);

        if (!is_dir($fullBasePath)) {
            $this->error("Папка не найдена по адресу: " . $fullBasePath);
            return;
        }

        $user = User::first();
        if (!$user) { $this->error("Пользователь не найден."); return; }

        $directory = new RecursiveDirectoryIterator($fullBasePath, RecursiveDirectoryIterator::SKIP_DOTS);
        $iterator = new RecursiveIteratorIterator($directory);
        
        $count = 0;
        $allowedExtensions = ['pdf', 'txt', 'docx', 'html'];

        foreach ($iterator as $file) {
            if ($file->isDir()) continue;

            $fileName = $file->getFilename();
            $extension = strtolower($file->getExtension());

            if (!in_array($extension, $allowedExtensions)) continue;

            $category = basename($file->getPath());
            if ($category === $folder) {
                $category = 'general';
            }

            // 2. ФОРМИРУЕМ ПУТЬ ДЛЯ БД (имитируем логику диска local)
            $fullPath = str_replace('\\', '/', $file->getRealPath());
            
            // Отрезаем всё до app/private/, чтобы путь в базе начинался с названия папки (init_kb/...)
            $privatePath = str_replace('\\', '/', storage_path('app/private'));
            $relativePath = ltrim(Str::after($fullPath, $privatePath), '/');

            // 3. Создаем запись (в file_path попадет "init_kb/subfolder/file.txt")
            $document = Document::updateOrCreate(
                ['file_path' => $relativePath],
                [
                    'user_id'  => $user->id,
                    'title'    => Str::headline(pathinfo($fileName, PATHINFO_FILENAME)),
                    'category' => $category,
                    'status'   => 'pending'
                ]
            );

            // 4. Отправляем в Job
            IndexDocumentJob::dispatch($document);

            $this->line("<info>В очереди [{$category}]:</info> {$fileName}");
            $count++;
        }

        $count === 0 
            ? $this->warn("Файлы не найдены.") 
            : $this->info("Успешно отправлено в очередь: {$count} файл(ов).");
    }


}
