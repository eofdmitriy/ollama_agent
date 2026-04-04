import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Search, Upload, FolderPlus, FileText, 
    Trash2, RotateCcw, AlertCircle, CheckCircle2, 
    Loader2, ShieldAlert, FileSearch 
} from 'lucide-react';
import { debounce } from 'lodash';


import UploadDocumentModal from './UploadDocumentModal';
import DocActionModal from './DocActionModal';

interface Document {
    id: number;
    title: string;
    category: string;
    status: 'pending' | 'processing' | 'indexed' | 'failed';
    error_message: string | null;
    active_chunks: number;
    created_at: string;
    deleted_at: string | null;
    user?: { name: string };
}

interface Props {
    documents: {
        data: Document[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    categories: string[];
    filters: { search?: string };
}

export default function KnowledgeBaseIndex({ documents, categories, filters }: Props) {
    const [params, setParams] = useState(filters);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [actionConfig, setActionConfig] = useState<{ 
        doc: Document, 
        type: 'block' | 'force-delete' | 'restore' 
    } | null>(null);

    // 1. СЛУШАЕМ СОКЕТЫ (Reverb)
    useEffect(() => {
        const channel = window.Echo.private('admin.kb');
        channel.listen('.DocumentStatusUpdated', () => {
            router.reload({ only: ['documents'] });
        });
        return () => window.Echo.leave('admin.kb');
    }, []);

    // 2. ФИЛЬТРАЦИЯ
    const updateFilters = useCallback(
        debounce((newParams) => {
            router.get(route('admin.kb.index'), newParams, { preserveState: true, replace: true });
        }, 300),
        []
    );

    useEffect(() => { updateFilters(params); }, [params]);

    // 3. РЕНДЕР СТАТУСА (Вынесен для переиспользования в мобилке и десктопе)
    const renderStatus = (doc: Document) => {
        if (doc.status === 'indexed') return (
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 size={12} /> Готово
            </span>
        );
        if (doc.status === 'processing') return (
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary animate-pulse bg-primary/5 px-2.5 py-1 rounded-full">
                <Loader2 size={12} className="animate-spin" /> Индексация
            </span>
        );
        if (doc.status === 'failed') return (
            <div className="flex items-center gap-2 group/tooltip relative"
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                // Используем координаты центра элемента для стабильности
                e.currentTarget.style.setProperty('--mouse-x', `${e.clientX}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${e.clientY}px`);
            }}
            >
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20 cursor-help">
                    <AlertCircle size={12} /> Ошибка
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); router.post(route('admin.kb.retry', doc.id)); }}
                    className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90 cursor-pointer"
                >
                    <RotateCcw size={14} />
                </button>
                <div className="fixed hidden group-hover/tooltip:block pointer-events-none z-50 
                        w-72 p-4 bg-neutral-900 text-white text-[10px] rounded-2xl shadow-2xl border border-white/10
                        -translate-x-1/2 -translate-y-[calc(100%+15px)] 
                        left-(--mouse-x) top-(--mouse-y)">
                        
                    <div className="font-black uppercase mb-1 text-red-400 opacity-70">Технический лог:</div>
                        <div className="whitespace-normal wrap-break-word leading-relaxed opacity-90 italic">
                            {doc.error_message || 'Неизвестный сбой векторизации'}
                        </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-900" />
                </div>
            </div>
        );
        return <span className="text-[9px] font-black uppercase text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full tracking-tighter">В очереди</span>;
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Knowledge Base', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="База знаний" />

            <div className="flex flex-col gap-4 p-4 md:gap-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">База знаний</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Управление контекстом ИИ</p>
                    </div>
                    <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <Upload size={18} /> Загрузить
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        className="w-full rounded-xl border border-sidebar-border/70 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        value={params.search || ''}
                        onChange={(e) => setParams({ ...params, search: e.target.value })}
                    />
                </div>

                {/* --- MOBILE VIEW (Cards) --- */}
                <div className="flex flex-col gap-3 md:hidden">
                    {documents.data.length > 0 ? documents.data.map((doc) => (
                        <div key={doc.id} className={`rounded-3xl border border-sidebar-border/70 bg-background p-5 shadow-sm transition-all ${doc.deleted_at ? 'opacity-50 grayscale bg-muted/20' : ''}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-2xl ${doc.deleted_at ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold truncate max-w-35 ${doc.deleted_at ? 'line-through' : 'text-foreground'}`}>
                                                {doc.title}
                                            </span>
                                            {doc.active_chunks > 0 && !doc.deleted_at && (
                                                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">
                                            {new Date(doc.created_at).toLocaleDateString()} • {doc.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setActionConfig({ doc, type: doc.deleted_at ? 'restore' : 'block' })} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                        {doc.deleted_at ? <RotateCcw size={18}/> : <ShieldAlert size={18}/>}
                                    </button>
                                    <button onClick={() => setActionConfig({ doc, type: 'force-delete' })} className="p-2 text-destructive hover:bg-destructive/5 rounded-xl transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-sidebar-border/30">
                                {renderStatus(doc)}
                                <span className="text-[9px] font-black uppercase text-muted-foreground italic">ID: {doc.id}</span>
                            </div>
                        </div>
                    )) : <div className="p-12 text-center text-muted-foreground text-sm">Документов нет</div>}
                </div>

                {/* --- DESKTOP VIEW (Table) --- */}
                <div className="hidden overflow-hidden rounded-[2.5rem] border border-sidebar-border/70 bg-background shadow-sm md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-muted-foreground font-bold uppercase text-[9px] tracking-[0.2em]">
                            <tr>
                                <th className="p-5">Документ</th>
                                <th className="p-5">Категория</th>
                                <th className="p-5 text-center">Статус</th>
                                <th className="p-5 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/70">
                            {documents.data.map((doc) => (
                                <tr key={doc.id} className={`group relative hover:bg-muted/20 transition-colors ${doc.deleted_at ? 'opacity-50 bg-muted/10' : ''}`}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-105 ${doc.deleted_at ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary shadow-sm shadow-primary/5'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`font-bold truncate max-w-45 lg:max-w-xs ${doc.deleted_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                        {doc.title}
                                                    </span>
                                                    {doc.active_chunks > 0 && !doc.deleted_at && (
                                                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 text-[8px] font-black uppercase border border-green-500/20 tracking-wider">
                                                            Актуален
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">
                                                    {new Date(doc.created_at).toLocaleDateString()} • {doc.user?.name || 'Система'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-sidebar-border/50 bg-muted/20 px-3 py-1 text-[9px] font-black uppercase text-muted-foreground tracking-tighter">
                                            <FolderPlus size={10} className="text-primary" /> {doc.category}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div 
                                        className="flex justify-center">
                                            {renderStatus(doc)}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link 
                                                href={route('admin.kb.show', doc.id)}
                                                className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                                                title="Просмотр чанков"
                                            >
                                                <FileSearch size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => setActionConfig({ doc, type: doc.deleted_at ? 'restore' : 'block' })}
                                                className={`p-2 rounded-xl transition-all hover:scale-110 cursor-pointer ${doc.deleted_at ? 'text-primary bg-primary/5' : 'text-amber-500 bg-amber-500/5'}`}
                                            >
                                                {doc.deleted_at ? <RotateCcw size={18}/> : <ShieldAlert size={18}/>}
                                            </button>
                                            <button 
                                                onClick={() => setActionConfig({ doc, type: 'force-delete' })}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-110 cursor-pointer"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap justify-center gap-1.5 py-6">
                    {documents.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || ''}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            onClick={(e) => !link.url && e.preventDefault()}
                            className={`px-4 py-2 rounded-2xl text-xs border transition-all ${
                                link.active 
                                ? 'bg-primary text-white border-primary font-black shadow-md shadow-primary/20 scale-105' 
                                : 'bg-background hover:bg-muted text-foreground border-sidebar-border/70 font-bold'
                            } ${!link.url && 'opacity-30 cursor-not-allowed grayscale'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Modals */}
            <UploadDocumentModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} categories={categories} />
            <DocActionModal isOpen={!!actionConfig} doc={actionConfig?.doc || null} type={actionConfig?.type || null} onClose={() => setActionConfig(null)} />
        </AppLayout>
    );
}

