<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_create_documents_table.php
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            
            // Привязка к юзеру. nullable() + set null позволяют сохранить базу знаний, 
            // даже если сотрудник, который её наполнял, будет удален из системы.
            $table->foreignId('user_id')->nullable()->constrained()->onNull('set null'); 
            
            // Название документа (например, "График отпусков 2024"). 
            // Мы будем добавлять его в каждый чанк для улучшения контекста.
            $table->string('title');
            
            // Категория (HR, IT, Sales). Позволит в будущем фильтровать поиск 
            // (например, искать ответ только в IT-инструкциях).
            $table->string('category');
            
            // Путь к физическому файлу в storage. Нужен, если мы захотим 
            // переиндексировать базу другой моделью (например, перейти с Ollama на OpenAI).
            $table->string('file_path');
            
            // Статус обработки. Векторизация — процесс долгий. 
            // React будет запрашивать этот статус, чтобы показать лоадер или ошибку.
            $table->string('status')->default('pending'); // 'pending', 'processing', 'indexed', 'failed'
            
            // Сюда запишем текст ошибки, если Ollama упадет или файл будет битым.
            $table->text('error_message')->nullable();
            
            // Позволяет "удалить" документ из системы, не стирая его физически сразу.
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
