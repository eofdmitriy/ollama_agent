import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChatboxEllipsesOutline } from "react-icons/io5";

// Используем интерфейс, который мы подготовили для отображения
interface FormattedMessage {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date | string;
  tokens?: number; // Если будешь передавать из Ollama
}

interface MessageListProps {
  messages: FormattedMessage[];
  ai_model?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, ai_model }) => {
  const aiName = ai_model;
  const initialIds = useMemo(() => new Set(messages.map(m => m.id)), []);
  
  if (messages.length === 0) {
    return (
      <motion.div
        key="empty-state"
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, scale: 0.95 }}
        variants={{
          initial: { opacity: 0 },
          animate: { 
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
          }
        }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        {/* Иконка с мягким "выпрыгиванием" */}
        <motion.div
          variants={{
            initial: { opacity: 0, scale: 0.5, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="inline-block p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-3xl mb-4 shadow-sm"
        >
          <IoChatboxEllipsesOutline className="w-12 h-12 text-blue-400"/>
        </motion.div>

        {/* Заголовок */}
        <motion.h3 
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 }
          }}
          className="text-xl font-bold text-gray-800 mb-1"
        >
          Начните диалог
        </motion.h3>

        {/* Описание */}
        <motion.p 
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 }
          }}
          className="text-gray-500 max-w-xs mx-auto"
        >
          Задайте вопрос {aiName}
        </motion.p>
      </motion.div>
    );
  }

return (
  <div className="space-y-4">
    <AnimatePresence initial={true}>
      {messages.map((message, index) => {
        const isInitial = initialIds.has(message.id);
        
        // РАСЧЕТ ИНВЕРСИИ:
        // Если сообщений 10, то для последнего (index 9) задержка будет 0,
        // для предпоследнего (index 8) — 0.08 и так далее.
        const reverseIndex = messages.length - 1 - index;

        return (
          <motion.div
            key={message.isUser ? `user-msg-${message.id}-${index}` : message.id}
            initial={{ opacity: 0, y: 5, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.2, 
              ease: "linear",
              delay: isInitial ? reverseIndex * 0.08 : 0 
            }}
            className={`flex w-full ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
             <div className={`relative group max-w-[92%] sm:max-w-[85%] md:max-w-[80%] ${message.isUser ? 'ml-4' : 'mr-4'}`}>
                <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-sm transition-colors duration-200 ${message.isUser ? 'bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-tr-none border-b border-blue-700' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-xs'}`}>
                    <div className={`flex items-center space-x-2 mb-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        {!message.isUser && (
                            <div className="w-5 h-5 bg-linear-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-white">AI</span>
                            </div>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${message.isUser ? 'text-blue-100' : 'text-gray-400'}`}>
                            {message.isUser ? 'Вы' : `${aiName}`}
                        </span>
                    </div>
                    <div className="max-w-none">
                        <p className="whitespace-pre-wrap wrap-break-word text-sm sm:text-base leading-relaxed">{message.text}</p>
                    </div>
                    <div className={`flex items-center mt-2 space-x-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] tabular-nums ${message.isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);



};

export default MessageList;
