import { useRef, useEffect, useCallback, useState,  useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoIosArrowDown } from "react-icons/io";
import type { ReactNode } from 'react';
import type { DBMessage } from '@/types/chat';

interface MessageBoxProps {
    children: {
        content: ReactNode;
        loading?: ReactNode;
    };
    messages: DBMessage[]; 
    isProcessing: boolean;
}


const MessageBox: React.FC<MessageBoxProps> = ({ children, messages, isProcessing  }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrolledMessageIdRef = useRef<number | string | null>(null);
  const isProcessingInertiaRef = useRef(isProcessing);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wasAtBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    isProcessingInertiaRef.current = isProcessing;
  }, [isProcessing]);

  // Мгновенный скролл в самый низ
  const forceScroll = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setUnreadCount(0);
      setShowScrollButton(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isAtBottom);
    if (isAtBottom) {
      setUnreadCount(0);
    } else {
      // КЛЮЧЕВОЕ: Обновляем только при ручном скролле, чтобы ResizeObserver знал, где стоять
      lastScrollTopRef.current = scrollTop;
    }
    wasAtBottomRef.current = isAtBottom;
  }, []);

    // 1. СЧЕТЧИК: Срабатывает СТРОГО при изменении массива
    useLayoutEffect(() => {
      const isNewMessage = messages.length > prevCountRef.current;
      
      if (isNewMessage && containerRef.current) {
        const lastMessage = messages[messages.length - 1];
        const container = containerRef.current;

        // Считаем остаток до низа
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        // Если дистанция больше 150px — значит мы точно НЕ внизу
        if (lastMessage?.role !== 'user' && distanceFromBottom > 150) {
          const diff = messages.length - prevCountRef.current;
          setUnreadCount(prev => prev + diff);
        }
      }
      prevCountRef.current = messages.length;
    }, [messages.length]);



  // 2. ОБСЕРВЕР: Управляет "прилипанием"

  useEffect(() => {
    if (!contentRef.current || !containerRef.current) return;

    const container = containerRef.current;

    const observer = new ResizeObserver(() => {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      // 1. Принудительный скролл вниз только для НОВЫХ сообщений юзера
      const isNewUserMessage = lastMessage.role === 'user' && lastScrolledMessageIdRef.current !== lastMessage.id;

      if (isNewUserMessage) {
        container.scrollTop = container.scrollHeight;
        lastScrolledMessageIdRef.current = lastMessage.id;
        wasAtBottomRef.current = true;
        return;
      }

      // 2. Если мы НЕ внизу (пользователь читает историю) — 
      // ПРОСТО ВЫХОДИМ. Не нужно переприсваивать scrollTop.
      // Браузер благодаря overflow-anchor: auto сам удержит позицию.
      if (!wasAtBottomRef.current) {
        return; 
      }

      // 3. Если мы прилипли к низу — продолжаем прилипать
      container.scrollTop = container.scrollHeight;
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [messages]);


  // Начальный скролл при загрузке
  useEffect(() => {
    forceScroll();
    setTimeout(forceScroll, 100);
  }, [forceScroll]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto relative"
      onScroll={handleScroll}
      style={{ overflowAnchor: 'auto', scrollBehavior: 'auto' }}
    >
      <div ref={contentRef} className="flex flex-col min-h-full p-4">
         <div className="flex-1">
            {children.content}
         </div>
         {children.loading && <div className="mt-4">{children.loading}</div>}
      </div>

    <AnimatePresence>
      {showScrollButton && (
        <motion.div 
          // Изменили bottom-24 на bottom-32 (или выше, например bottom-40), чтобы поднять кнопку
          className="fixed bottom-28 right-4 lg:right-8 z-50"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0], // Кнопка плавно ходит вверх-вниз на 10px
            scale: 1 
          }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ 
            // Комбинируем типы анимации
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
            y: {
              duration: 2,         // Скорость плавания
              repeat: Infinity,    // Бесконечно
              ease: "easeInOut"    // Плавность
            }
          }}
        >
          <button 
            onClick={forceScroll} 
            className="relative p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all active:scale-90 cursor-pointer"
          >
            <IoIosArrowDown className="w-6 h-6" />
            
            {/* Бейдж оставляем без изменений */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={`unread-badge-${unreadCount}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};




export default MessageBox;
