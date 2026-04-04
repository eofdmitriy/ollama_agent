import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MessageSquare, Trash2, Search, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import DeleteChatModal from './DeleteChatModal';

interface Chat {
    id: number;
    title: string;
    model_name: string;
    messages_count: number;
    created_at: string;
    deleted_at: null | string;
}

interface Props {
    targetUser: { id: number; name: string };
    chats: {
        data: Chat[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; date_from?: string; date_to?: string };
}

export default function UserChats({ targetUser, chats, filters }: Props) {
    const [params, setParams] = useState(filters);
    const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Users', href: route('admin.users.index') },
        { title: `Chats: ${targetUser.name}`, href: '#' },
    ];

    const updateFilters = useCallback(
        debounce((newParams) => {
            router.get(route('admin.users.chats', targetUser.id), newParams, {
                preserveState: true,
                replace: true,
            });
        }, 300),
        []
    );

    useEffect(() => {
        updateFilters(params);
    }, [params]);

       return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chats - ${targetUser.name}`} />

            <div className="flex flex-col gap-4 p-4 md:gap-6 lg:p-8">
                {/* Заголовок и Адаптивные Фильтры */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-xl font-bold text-foreground">Чаты пользователя: {targetUser.name}</h1>
                    
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Поиск */}
                        <div className="relative w-full lg:w-64">
                            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Поиск по теме..."
                                className="w-full rounded-xl border border-sidebar-border/70 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={params.search || ''}
                                onChange={(e) => setParams({ ...params, search: e.target.value })}
                            />
                        </div>

                        {/* Блок Дат */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">От</span>
                                <input
                                    type="date"
                                    className="w-full sm:w-auto rounded-xl border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    value={params.date_from || ''}
                                    max={params.date_to}
                                    onChange={(e) => setParams({ ...params, date_from: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">До</span>
                                <input
                                    type="date"
                                    className="w-full sm:w-auto rounded-xl border border-sidebar-border/70 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    value={params.date_to || ''}
                                    min={params.date_from}
                                    onChange={(e) => setParams({ ...params, date_to: e.target.value })}
                                />
                            </div>

                            {/* Сброс */}
                            {(params.date_from || params.date_to || params.search) && (
                                <button 
                                    onClick={() => setParams({ search: '', date_from: '', date_to: '' })}
                                    className="p-2 text-muted-foreground hover:text-primary transition-colors self-end sm:self-center cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- ТАБЛИЦА (Desktop) --- */}
                <div className="hidden overflow-hidden rounded-xl border border-sidebar-border/70 bg-background shadow-sm md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">Название чата</th>
                                <th className="p-4 text-center">Модель</th>
                                <th className="p-4 text-center">Сообщений</th>
                                <th className="p-4">Создан</th>
                                <th className="p-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/70">
                            {chats.data.length > 0 ? chats.data.map((chat) => (
                                <tr key={chat.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4 max-w-xs truncate">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${chat.deleted_at ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                {chat.title || 'Новый чат'}
                                            </span>                                            
                                            {chat.deleted_at && (
                                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded">
                                                    Удален
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold text-muted-foreground bg-muted/30 whitespace-nowrap">
                                            {chat.model_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${chat.messages_count > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <MessageSquare className="size-3" />
                                            {chat.messages_count}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{new Date(chat.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <Link href={route('admin.chats.show', chat.id)} className="text-xs font-bold text-primary hover:underline uppercase">Смотреть</Link>
                                            <button onClick={() => { setChatToDelete(chat); setIsDeleteOpen(true); }} className="p-1 text-muted-foreground hover:text-destructive transition-all cursor-pointer disabled:cursor-not-allowed">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">Чатов не найдено</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- КАРТОЧКИ (Mobile) --- */}
                <div className="flex flex-col gap-3 md:hidden">
                    {chats.data.length > 0 ? chats.data.map((chat) => (
                        <div key={chat.id} className="rounded-2xl border border-sidebar-border/70 bg-background p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-0.5 rounded border text-[10px] uppercase font-bold text-muted-foreground bg-muted/30">
                                    {chat.model_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {new Date(chat.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-foreground mb-3 line-clamp-2">{chat.title || 'Новый чат'}</h3>
                            
                            <div className="flex items-center justify-between border-t border-sidebar-border/50 pt-3">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <MessageSquare size={14} />
                                    <span>{chat.messages_count} сообщ.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link 
                                        href={route('admin.chats.show', chat.id)} 
                                        className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary active:bg-primary/20"
                                    >
                                        Смотреть
                                        <ChevronRight size={14} />
                                    </Link>
                                    <button 
                                        onClick={() => { setChatToDelete(chat); setIsDeleteOpen(true); }}
                                        className="inline-flex items-center justify-center size-9 rounded-xl bg-destructive/5 text-destructive active:bg-destructive/10 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-10 text-muted-foreground italic">Чатов не найдено</p>
                    )}
                </div>

                {/* Пагинация (обновленный стиль с Users) */}
                <div className="flex flex-wrap justify-center gap-1 py-4">
                    {chats.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || ''}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            onClick={(e) => !link.url && e.preventDefault()}
                            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm border transition-colors ${
                                link.active 
                                ? 'bg-primary text-primary-foreground border-primary font-bold' 
                                : 'bg-background hover:bg-muted text-foreground border-sidebar-border/70'
                            } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                        />
                    ))}
                </div>
            </div>

            <DeleteChatModal 
                chat={chatToDelete} 
                isOpen={isDeleteOpen} 
                onClose={() => setIsDeleteOpen(false)} 
            />
        </AppLayout>
    );
}
