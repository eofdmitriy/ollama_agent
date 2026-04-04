import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Database, Layers, Calendar, Tag } from 'lucide-react';

interface Chunk {
    id: number;
    content: string;
    is_current: boolean;
    valid_from: string;
    valid_to: string | null;
}

interface Props {
    document: { id: number; title: string; category: string };
    chunks: {
        data: Chunk[];
        links: any[];
    };
}

export default function DocumentShow({ document, chunks }: Props) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Knowledge Base', href: route('admin.kb.index') },
        { title: document.title, href: '#' },
    ];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Просмотр: ${document.title}`} />

            <div className="flex flex-col gap-6 p-4 md:gap-8 lg:p-8 max-w-5xl mx-auto w-full">
                {/* Шапка с кнопкой назад */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('admin.kb.index')}
                            className="p-2 rounded-xl bg-background border border-sidebar-border/70 hover:bg-muted transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground truncate max-w-md">
                                {document.title}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                    <Tag size={10} /> {document.category}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                    Всего фрагментов: {chunks.data.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Список чанков */}
                <div className="grid gap-4">
                    {chunks.data.length > 0 ? chunks.data.map((chunk, index) => (
                        <div 
                            key={chunk.id} 
                            className={`relative overflow-hidden rounded-3xl border border-sidebar-border/70 bg-background p-6 shadow-sm transition-all hover:shadow-md ${!chunk.is_current ? 'opacity-50' : ''}`}
                        >
                            {/* Индикаторы статуса чанка */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                        <Layers size={10} /> Фрагмент #{index + 1}
                                    </span>
                                    {chunk.is_current ? (
                                        <span className="text-[9px] font-black uppercase text-green-600 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                            Актуален
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                            Архивный
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Calendar size={10} />
                                    {new Date(chunk.valid_from).toLocaleDateString()} 
                                    {chunk.valid_to && ` — ${new Date(chunk.valid_to).toLocaleDateString()}`}
                                </div>
                            </div>

                            {/* Тело контента */}
                            <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium font-sans">
                                {chunk.content}
                            </div>

                            {/* Векторная подпись (для стиля) */}
                            <div className="mt-4 pt-4 border-t border-sidebar-border/30 flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                    <Database size={10} /> Векторизован
                                </div>
                                <span className="text-[9px] text-muted-foreground opacity-30 italic">ID: {chunk.id}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="p-20 text-center rounded-3xl border-2 border-dashed border-sidebar-border/50">
                            <Layers size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground font-medium">Для этого документа еще не созданы фрагменты.</p>
                        </div>
                    )}
                </div>

                {/* Пагинация */}
                <div className="flex flex-wrap justify-center gap-1.5 py-6">
                    {chunks.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || ''}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-4 py-2 rounded-2xl text-xs border transition-all ${
                                link.active 
                                ? 'bg-primary text-white border-primary font-black shadow-md' 
                                : 'bg-background hover:bg-muted text-foreground border-sidebar-border/70 font-bold'
                            } ${!link.url && 'opacity-30 cursor-not-allowed'}`}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
