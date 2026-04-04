import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import AuthenticatedChatLayout from '@/layouts/AuthenticatedChatLayout';
import MessageBox from './MessageBox';
import MessageList from './MessageList';
import InputForm from './InputForm';
import LoadingIndicator from './LoadingIndicator';
import { DBMessage } from '@/types/chat';

export default function Show() {
    const { currentChat, messages, ollamaStatus, ai_model } = usePage<any>().props;
    
    const [localMessages, setLocalMessages] = useState(messages);
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Подписка на сообщения конкретного чата (MessageSent)
    useEffect(() => {
        const echo = (window as any).Echo;
        if (!currentChat?.id || !echo) return;

        echo.private(`chat.${currentChat.id}`)
            .listen('.MessageSent', (e: { message: DBMessage }) => {
                setLocalMessages((prev: DBMessage[]) => {
                    if (prev.find((m: DBMessage) => m.id === e.message.id)) return prev;
                    return [...prev, e.message];
                });
                if (e.message.role !== 'user') {
                setIsAiProcessing(false);
            }
            });

        return () => echo.leave(`chat.${currentChat.id}`);
    }, [currentChat?.id]);

    // Синхронизация при смене чата
    useEffect(() => {
        // Проверяем последнее сообщение в массиве из пропсов
        const lastMsg = messages[messages.length - 1];
        
        const isWaiting = lastMsg?.role === 'user';

        setIsAiProcessing(isWaiting);
        setLocalMessages(messages);
    }, [currentChat?.id, messages]); 


    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        const tempUserMsg: DBMessage = {
            id: Date.now(),
            content: text,
            role: 'user',
            created_at: new Date().toISOString()
        };
        setLocalMessages((prev: DBMessage[]) => [...prev, tempUserMsg]);

        const isFirstMessage = messages.length === 0 || currentChat.title === 'Новый чат';

        router.post(route('chats.messages.store', currentChat.id), {
            content: text
        }, {
            only: isFirstMessage ? ['messages', 'currentChat', 'allChats'] : ['messages'],
            preserveScroll: true,
            onStart: () => setIsAiProcessing(true),
            onError: () => {
                setLocalMessages(messages);
                setIsAiProcessing(false); 
            }
        });
    };

    return (
        <AuthenticatedChatLayout messages={localMessages} ai_model={ai_model}>
            <MessageBox messages={localMessages}>
                {{
                    content: <MessageList messages={localMessages.map((m: any) => ({
                        id: m.id,
                        text: m.content,
                        isUser: m.role === 'user',
                        timestamp: m.created_at
                    }))} ai_model={ai_model}/>,
                    loading: isAiProcessing && <LoadingIndicator />
                }}
            </MessageBox>
            
            <InputForm
                onSendMessage={handleSendMessage}
                isLoading={isAiProcessing}
                healthStatus={ollamaStatus ?? { status: 'down', model: 'Загрузка...' }}
            />
        </AuthenticatedChatLayout>
    );
}


