export interface DBMessage {
    id: number;
    chat_id?: number;
    role: 'user' | 'assistant' | 'system';
    content: string; 
    created_at: string;
    updated_at?: string;
}

export interface DBChat {
    id: number;
    title: string;
    model_name: string;
    created_at: string;
    messages_count?: number; 
    updated_at?: string;
}

export interface OllamaStatus {
    status: 'online' | 'down';
    model?: string;
    error?: string;
}

// Пропсы, которые приходят в компонент от Inertia
export interface ChatPageProps {
    currentChat: DBChat;
    messages: DBMessage[];
    allChats: DBChat[];
    ollamaStatus?: OllamaStatus;
    auth: {
        user: { id: number; name: string; role: 'user' | 'admin' };
    };
}
