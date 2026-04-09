<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Jobs\IndexDocumentJob;
use App\Events\DocumentStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class KnowledgeBaseController extends Controller
{
    /**
     * Список документов с категориями из папок
     */
    public function index(Request $request)
    {
        // 1. Проверяем и создаем основную рабочую папку 'kb'
        if (!Storage::disk('local')->exists('kb')) {
            Storage::disk('local')->makeDirectory('kb');
        }

        // 2. Собираем категории из всех источников (директорий)
        $kbDirs = Storage::disk('local')->directories('kb');
        $initDirs = Storage::disk('local')->exists('init_kb') 
            ? Storage::disk('local')->directories('init_kb') 
            : [];

        $categories = collect($kbDirs)
            ->concat($initDirs)
            ->map(fn($path) => basename($path))
            ->unique()
            ->sort()
            ->values()
            ->all();

        // 3. Формируем запрос с подсчетом активных чанков
        $query = Document::with('user')
            ->withCount(['chunks as active_chunks' => function ($query) {
                $query->where('is_current', true);
            }])
            ->withTrashed()
            ->latest();

        // Фильтрация поиска (оборачиваем в группу, чтобы не мешать softDeletes)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%");
            });
        }

        return Inertia::render('admin/knowledge-base/Index', [
            'documents' => $query->paginate(15)->withQueryString(),
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }


    /**
     * Загрузка нового файла
     */
    public function upload(Request $request)
    {
        // 1. Валидация (оставляем)
        $request->validate([
            'file' => 'required|file|mimes:pdf,docx,txt,html|max:20480',
            'category' => 'required_without:new_category|nullable|string',
            'new_category' => 'required_without:category|nullable|string|max:50',
        ], [
            'file.required' => 'Выберите файл для загрузки.',
            'file.mimes'    => 'Допустимые форматы: PDF, DOCX, TXT, HTML.',
            'file.max'      => 'Файл слишком большой (максимум 20 МБ).',
            'category.required_without' => 'Выберите категорию или создайте новую.',
            'new_category.required_without' => 'Введите название новой категории или выберите из списка.',
            'new_category.max' => 'Название категории не должно превышать 50 символов.',
        ]);

        // 2. Категория
        $category = $request->new_category 
        ? trim($request->new_category) 
        : $request->category;

        // 3. Имена
        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $diskFileName = time() . '_' . $originalName; 
        $cleanTitle = Str::headline(pathinfo($originalName, PATHINFO_FILENAME));

        // 4. СОХРАНЕНИЕ (Жестко в storage/app/kb/...)
        // Мы используем Storage::disk('local'), но в БД пишем путь без 'private'
        $path = Storage::disk('local')->putFileAs("kb/{$category}", $file, $diskFileName);

        // 5. Создаем запись
        $document = Document::create([
            'user_id'   => auth()->id(),
            'title'     => $cleanTitle,
            'category'  => $category,
            'file_path' => $path,  
            'status'    => 'pending',
        ]);

        // 6. Job
        IndexDocumentJob::dispatch($document);

        return back()->with('success', "Документ «{$cleanTitle}» в очереди.");
    }


    // Кнопка "Повторить" при ошибке
    public function retry(Document $document) {
        $document->update(['status' => 'pending', 'error_message' => null]);
        broadcast(new DocumentStatusUpdated($document));
        IndexDocumentJob::dispatch($document);
        return back()->with('info', "Документ «{$document->title}» отправлен на повторную обработку.");
    }


    /**
     * Блокировка документа (Soft Delete)
     */
    public function destroy(Document $document)
    {
        // Сработает booted() в модели: чанки тоже "уйдут" в soft delete
        $document->delete();
        return back();
    }

    /**
     * Разблокировка документа
     */
    public function restore($id)
    {
        $document = Document::withTrashed()->findOrFail($id);
        $document->restore(); // booted() вернет чанки в строй
        return back();
    }

    /**
     * Удаление навсегда
     */
    public function forceDelete($id)
    {
        $document = Document::withTrashed()->findOrFail($id);
        
        // Удаляем файл физически
        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->forceDelete();
        return back();
    }

    public function show(Document $document)
    {
        $chunks = $document->chunks()
            ->withTrashed() 
            ->orderBy('id', 'asc')
            ->paginate(50); 

        return Inertia::render('admin/knowledge-base/Show', [
            'document' => $document,
            'chunks' => $chunks,
        ]);
    }

}
