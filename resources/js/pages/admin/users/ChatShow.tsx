import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Bot, User, Clock, MessageCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DeleteChatModal from './DeleteChatModal';

interface Props {
    chat: {
        id: number;
        title: string;
        model_name: string;
        user: { id: number; name: string };
    };
    messages: {
        id: number;
        role: 'user' | 'assistant';
        content: string;
        created_at: string;
    }[];
}

export default function ChatShow({ chat, messages }: Props) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Хлебные крошки теперь выводят тему чата
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Users', href: route('admin.users.index') },
        { title: `Chats: ${chat.user.name}`, href: route('admin.users.chats', chat.user.id) },
        { title: chat.title || 'Conversation', href: '#' },
    ];

    // Авто-скролл вниз при загрузке страницы
    useEffect(() => {
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [messages]); 

    return (
    <AppLayout breadcrumbs={breadcrumbs}>
        <Head title={`Chat: ${chat.title || 'View'}`} />

        {/* Основной контейнер на всю доступную высоту без скролла всей страницы */}
        <div className="flex h-[calc(100vh-120px)] w-full flex-col overflow-hidden">
            
            {/* Шапка чата: Фиксированная (shrink-0) */}
            <div className="shrink-0 border-b p-4 lg:p-8 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link 
                            href={route('admin.users.chats', chat.user.id)}
                            className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors border border-sidebar-border/70"
                        >
                            <ChevronLeft size={18} className="sm:size-5" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="max-w-50 truncate text-lg font-black tracking-tight sm:max-w-none sm:text-2xl">
                                {chat.title || 'Без названия'}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                                <span className="whitespace-nowrap rounded-md border border-primary/10 bg-primary/10 px-2 py-0.5 text-primary sm:py-1">
                                    Model: {chat.model_name}
                                </span>
                                <span className="hidden items-center gap-1 xs:flex">
                                    <User size={10}/> {chat.user.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsDeleteOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive shadow-sm transition-all active:scale-95 hover:bg-destructive hover:text-white sm:px-5 sm:py-2.5 sm:text-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} />
                        <span>Удалить чат</span>
                    </button>
                </div>
            </div>

            {/* ТЕЛО ЧАТА: Скроллится только этот блок (overflow-y-auto) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 scroll-smooth">
                {messages.length > 0 ? (
                    <>
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex gap-2 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'}`}
                            >
                                <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:size-10 ${
                                    msg.role === 'user' 
                                    ? 'bg-primary text-white border-primary' 
                                    : 'bg-background border-sidebar-border/70 text-muted-foreground'
                                }`}>
                                    {msg.role === 'user' ? <User size={16} className="sm:size-5" /> : <Bot size={16} className="sm:size-5" />}
                                </div>

                                <div className={`flex max-w-[92%] flex-col sm:max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm sm:rounded-3xl sm:px-5 sm:py-3 ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                        : 'bg-muted/30 border border-sidebar-border/50 text-foreground rounded-tl-none'
                                    }`}>
                                        <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1 px-1 text-[9px] font-bold uppercase text-muted-foreground/50">
                                        <Clock size={10} />
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Якорь для скролла */}
                        <div ref={messagesEndRef} className="h-4 shrink-0" />
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center py-20 border-2 border-dashed rounded-4xl bg-muted/5">
                        <MessageCircle size={48} className="mb-4 text-muted-foreground/20 sm:size-64" />
                        <p className="text-base font-medium italic text-muted-foreground/40 sm:text-lg">В этом чате пока пусто</p>
                    </div>
                )}
            </div>
        </div>

        <DeleteChatModal 
            chat={chat} 
            isOpen={isDeleteOpen} 
            onClose={() => setIsDeleteOpen(false)} 
        />
    </AppLayout>


    );
}
