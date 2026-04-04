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
}


const MessageBox: React.FC<MessageBoxProps> = ({ children, messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wasAtBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const prevCountRef = useRef(messages.length);

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
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
    
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
    // 1. СЧЕТЧИК: Срабатывает СТРОГО при изменении массива
    useLayoutEffect(() => {
    const isNewMessage = messages.length > prevCountRef.current;
    
    if (isNewMessage && containerRef.current) {
      const lastMessage = messages[messages.length - 1];
      const container = containerRef.current;

      // Считаем остаток до низа
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      
      // Выводим в консоль для проверки (потом удалим)
      console.log(`[MSG] Дистанция до низа: ${distanceFromBottom}px. Лимит: 150px`);

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

      if (lastMessage.role === 'user' || wasAtBottomRef.current) {
        // Режим ПРИЛИПАНИЯ
        container.scrollTop = container.scrollHeight;
      } else {
        // Режим ЧТЕНИЯ ИСТОРИИ: жестко держим позицию
        container.scrollTop = lastScrollTopRef.current;
      }
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
      style={{ overflowAnchor: 'none', scrollBehavior: 'auto' }}
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
          className="fixed bottom-24 right-8 z-50"
          // Анимация самой кнопки: вылетает снизу с легким увеличением
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <button 
            onClick={forceScroll} 
            className="relative p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <IoIosArrowDown className="w-6 h-6" />
            
            {/* Анимация бейджа */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  // Ключ по значению unreadCount заставляет бейдж "подпрыгивать" при изменении цифры
                  key={`unread-badge-${unreadCount}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
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
