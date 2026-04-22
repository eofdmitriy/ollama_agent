import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/pages/chat/Header';
import Sidebar from '@/pages/chat/Sidebar';
import { useDeviceDetection } from '@/hooks/use-device-detection';


interface LayoutProps {
    children: React.ReactNode;
    showHistory?: boolean; 
    messages?: any;
    ai_model?: string;
}

export default function AuthenticatedChatLayout({ children, showHistory = true, messages , ai_model}: LayoutProps) {
    // Достаем данные через usePage, чтобы они всегда были актуальны
    const { 
        currentChat, 
        allChats: initialChats,
        ollamaStatus,
        auth,
    } = usePage<any>().props;

    const { isDesktop } = useDeviceDetection();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [localChats, setLocalChats] = useState(initialChats);
    const [unreadChatIds, setUnreadChatIds] = useState<number[]>([]);
    const prevMessagesCount = useRef(messages?.length || 0);
    const [isReloading, setIsReloading] = useState(false);

    const handleRefreshStatus = () => {
        router.reload({ 
                only: ['ollamaStatus'],
                onStart: () => setIsReloading(true),
                onFinish: () => setIsReloading(false),
            });
    };

    const currentStatus = isReloading 
    ? { status: 'loading', model: 'Загрузка...' } 
    : (ollamaStatus || { status: 'loading', model: 'Загрузка...' });

    useEffect(() => {
        setLocalChats(initialChats);
    }, [initialChats]);

    const moveChatToTop = (chatId: number) => {
        setLocalChats((prev: any[]) => {
            const index = prev.findIndex(c => c.id === chatId);
            if (index <= 0) return prev;
            const updated = [...prev];
            const [targetChat] = updated.splice(index, 1);
            return [targetChat, ...updated];
        });
    };

    // Оптимистичная сортировка для ТЕКУЩЕГО чата (когда пишем мы)
    useEffect(() => {
        const currentCount = messages?.length || 0;
        if (currentCount > prevMessagesCount.current && currentChat?.id) {
            moveChatToTop(currentChat.id);
        }
        prevMessagesCount.current = currentCount;
    }, [messages, currentChat?.id]);

    // Подписка на ВСЕ чаты
    useEffect(() => {
        const echo = (window as any).Echo;
        if (!auth?.user?.id || !echo) return;

        // 1. СРАЗУ обновляем статус при смене чата 
        if (currentChat?.id) {
            console.log('Обновляю статус Ollama при переключении на чат:', currentChat.id);
            router.reload({ only: ['ollamaStatus'] });
        }

        // 2. ПОДПИСКА на события
        echo.private(`user.${auth.user.id}`)
            .listen('.MessageSent', (e: { message: any }) => {
                const incomingChatId = e.message.chat_id;
                
                moveChatToTop(incomingChatId);
                if (incomingChatId !== currentChat?.id) {
                    setUnreadChatIds(prev => [...new Set([...prev, incomingChatId])]);
                }

                // Дополнительная проверка статуса, если прилетела системная ошибка
                if (e.message.role === 'system' && incomingChatId === currentChat?.id) {
                    router.reload({ only: ['ollamaStatus'] });
                }
            });

        return () => echo.leave(`user.${auth.user.id}`);
    }, [currentChat?.id, auth?.user?.id]);



    useEffect(() => {
        if (currentChat?.id) {
            setUnreadChatIds(prev => prev.filter(id => id !== currentChat.id));
        }
    }, [currentChat?.id]);


    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Глобальная подписка на изменение заголовков (ChatUpdated)
    useEffect(() => {
        const echo = (window as any).Echo;
        if (!auth?.user?.id || !echo) return;

       echo.private(`user.${auth.user.id}`)
            .listen('.ChatUpdated', (e: any) => {
                console.log('Layout: Поймал обновление заголовка', e.chat.title);
                // Обновляем только список чатов и текущий чат (для хедера)
                router.reload({ 
                    only: ['allChats', 'currentChat'],
                });
            });

        return () => echo.leave(`user.${auth.user.id}`);
    }, [auth?.user?.id]);

    const handleCreateChat = () => {
        router.post(route('chats.store'), {}, {
            onSuccess: () => {
                console.log('Sidebar: Чат создан или переиспользован, обновляю статус Ollama');
                router.reload({ 
                    only: ['ollamaStatus'],
                });
            },
            preserveState: false 
        });
    };


    const handleClearChat = (id: number) => {
        const isDeletingCurrent = id === currentChat?.id;
        router.delete(route('chats.destroy', id), {
            data: { current_chat_id: currentChat?.id },
            preserveScroll: true,
            only: isDeletingCurrent ? ['messages', 'allChats', 'currentChat'] : ['allChats'], 
        });
    };

    const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const shouldShowSidebar = isMounted && (isDesktop ? true : isSidebarOpen);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-screen bg-linear-to-br from-gray-50 to-blue-50/30"
            >
                <Head title={currentChat ? `Чат: ${currentChat.title}` : 'Чат'} />

                <Header 
                    title={currentChat?.title || 'Новый чат'}
                    status={currentStatus.status}  
                    onToggleSidebar={handleToggleSidebar}
                    ai_model={ai_model}
                    showHistory={showHistory}
                />
                
                <div className="flex flex-1 overflow-hidden relative bg-neutral-50">
                    <Sidebar
                        healthStatus={currentStatus} 
                        model={currentChat?.model_name || 'Загрузка...'}
                        messageCount={messages?.length || 0}
                        allChats={localChats || []}
                        currentChatId={currentChat?.id}
                        onClearChat={handleClearChat}
                        onCreateChat={handleCreateChat}
                        onRefreshStatus={handleRefreshStatus}
                        isOpen={shouldShowSidebar} 
                        onClose={() => setIsSidebarOpen(false)} 
                        showHistory={showHistory}
                        unreadChatIds={unreadChatIds}
                    />
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {children}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
