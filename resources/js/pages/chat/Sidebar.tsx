import React, { useEffect, useRef, useState, useCallback, Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { RiDeleteBinLine } from "react-icons/ri";
import { RxUpdate, RxPlus } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { Link } from '@inertiajs/react';
import { IoPersonOutline } from "react-icons/io5";
import { RiLogoutBoxLine } from "react-icons/ri";
import LogoutModal from './LogoutModal';
import { useDeviceDetection } from '@/hooks/use-device-detection';
import type { DBChat } from '@/types/chat';
import type { OllamaStatus } from '@/types/chat';

interface SidebarProps {
  healthStatus?: OllamaStatus; // Сделали необязательным
  model?: string;             // Сделали необязательным
  messageCount?: number;
  allChats?: DBChat[];        // Сделали необязательным
  currentChatId?: number;     // Сделали необязательным
  onClearChat: (id: number) => void; 
  onCreateChat: () => void;
  onRefreshStatus: () => void;
  isOpen: boolean;
  onClose: () => void;
  showHistory?: boolean;
  unreadChatIds?: number[];
}

const Sidebar: React.FC<SidebarProps> = ({
  healthStatus = { status: 'down', model: 'Загрузка...' }, // Дефолт
  model = 'Ollama',
  messageCount = 0,
  allChats = [], // Пустой массив, если чатов нет
  currentChatId,
  onClearChat,
  onCreateChat,
  onRefreshStatus,
  isOpen,
  onClose,
  showHistory = true,
  unreadChatIds = [],
}) => {
  const [localChats, setLocalChats] = React.useState(allChats);
  const { isTouchDevice } = useDeviceDetection();
  const overlayRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  // Состояния логики свайпов
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  // Состояние модального окна
  const [chatIdToDelete, setChatIdToDelete] = useState<number | null>(null);
  // Реф активного чата
  const activeChatRef = useRef<HTMLDivElement>(null);
  const [chatIdToLogout, setChatIdToLogout] = useState(false);

  useEffect(() => {
        setLocalChats(allChats);
    }, [allChats]);

  //Скролл к активному чату

  useEffect(() => {
  if (activeChatRef.current) {
    activeChatRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
  }, [currentChatId]); // Срабатывает при каждом переключении чата

  const handleConfirmDelete = () => {
    if (chatIdToDelete !== null) {
        // Оптимистично удаляем из локального списка
        setLocalChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));
        // Вызываем серверный метод (Inertia delete)
        onClearChat(chatIdToDelete);
        // Закрываем модалку
        setChatIdToDelete(null);
    }
  };


  // Анимации 
  const sidebarVariants = {
    closed: {
      x: '-100%',
      transition: { type: 'tween' as const, duration: 0.2, ease: 'easeInOut' as const }
    },
    open: {
      x: 0,
      transition: {
        type: 'tween' as const,
        duration: 0.2,
        ease: 'easeInOut' as const,
        staggerChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0, transition: { type: 'tween' as const, duration: 0.1 } }
  };

  // --- ЛОГИКА СВАЙПОВ И ЖЕСТОВ ---
  const handleSwipe = useCallback((e: any, info: PanInfo) => {
    const SWIPE_THRESHOLD = 50;
    const SWIPE_VELOCITY_THRESHOLD = 500;
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      onClose();
    }
  }, [onClose]);

  const handleOverlayTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(true);
    setSwipeDirection(null);
    setOverlayOpacity(0.3);
  }, [isTouchDevice]);

  const handleOverlayTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice || !touchStart || !isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      // Динамическое изменение прозрачности при свайпе
      setOverlayOpacity(direction === 'right' ? 0.4 : 0.2);
    }
  }, [isTouchDevice, touchStart, isSwiping]);

  const handleOverlayTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice || !touchStart) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    if (Math.abs(deltaX) > 50) {
      onClose();
    }
    resetTouchState();
  }, [isTouchDevice, touchStart, onClose]);

  const resetTouchState = useCallback(() => {
    setTouchStart(null);
    setIsSwiping(false);
    setSwipeDirection(null);
    setOverlayOpacity(0.3);
  }, []);

  const handleOverlayTouchCancel = useCallback(() => {
    if (!isTouchDevice) return;
    resetTouchState();
  }, [isTouchDevice, resetTouchState]);

  // Блокировка скролла body
  useEffect(() => {
    if (isOpen && isTouchDevice) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen, isTouchDevice]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: overlayOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black z-40"
            onClick={onClose}
            onTouchStart={handleOverlayTouchStart}
            onTouchMove={handleOverlayTouchMove}
            onTouchEnd={handleOverlayTouchEnd}
            onTouchCancel={handleOverlayTouchCancel}
            style={{
              cursor: isSwiping ? (swipeDirection === 'right' ? 'grabbing' : 'grab') : 'pointer',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={sidebarRef}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        drag={isTouchDevice ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleSwipe}
        className="fixed lg:static top-0 left-0 h-full w-80 max-w-full bg-white border-r border-gray-200 flex flex-col z-50 shadow-xl lg:shadow-none overflow-hidden"
        style={{
          cursor: isTouchDevice ? (isSwiping ? 'grabbing' : 'grab') : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Мобильная шапка сайдбара */}
        <div className="lg:hidden flex justify-end p-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 rounded-lg">
            <IoMdClose className="w-6 h-6 text-gray-600" />
          </motion.button>
        </div>
        
        <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">
          {/* КНОПКА СОЗДАНИЯ ЧАТА */}
          <motion.button
            variants={itemVariants}
            onClick={() => {
              onClose();
              onCreateChat();
            }}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <RxPlus className="w-5 h-5" /> Новый чат
          </motion.button>

          {/* СПИСОК ЧАТОВ ИЗ БД */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">История чатов</h2>
          <nav className="flex-1 overflow-y-auto space-y-1 pr-2 overflow-x-hidden">
              {localChats
              .filter(chat => {
                  const count = chat.messages_count ?? 0;
                  return (count > 0 || chat.title !== 'Новый чат') || chat.id === currentChatId;
              })
              .sort((a, b) => {
                  // Вычисляем, является ли чат "пустым черновиком"
                  const aIsEmpty = (a.messages_count ?? 0) === 0;
                  const bIsEmpty = (b.messages_count ?? 0) === 0;

                  // Если А пустой, а Б нет — А идет вверх (-1)
                  if (aIsEmpty && !bIsEmpty) return -1;
                  // Если Б пустой, а А нет — Б идет вверх (1)
                  if (!aIsEmpty && bIsEmpty) return 1;

                  // Во всех остальных случаях (оба пустые или оба с сообщениями) 
                  // сохраняем порядок от Laravel
                  return 0;
              })
              .map((chat) => (
                  <div key={chat.id} ref={chat.id === currentChatId ? activeChatRef : null} 
                   className={`group relative flex items-center mb-1 scroll-mt-2 scroll-mb-2`}>
                      {/* Ссылка на чат */}
                      <Link
                        href={route('chats.show', chat.id)}
                        onClick={onClose}
                        className={`flex items-center w-full px-3 py-3 rounded-xl text-sm transition-all border group/link ${
                            chat.id === currentChatId
                                ? 'bg-blue-50 text-blue-700 font-semibold border-blue-100 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 border-transparent hover:text-gray-900'
                        }`}
                    >
                        {/* Контейнер для индикатора */}
                        <div className="shrink-0 w-4 flex justify-center mr-2">
                            {unreadChatIds?.includes(chat.id) && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </div>

                        {/* Текст чата с отступом справа под корзину */}
                        <span className="truncate flex-1 pr-8">
                            {chat.title}
                        </span>
                    </Link>


                      {/* Кнопка удаления */}
                      <button
                          onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); 
                              setChatIdToDelete(chat.id);
                          }}
                          className={`
                              absolute right-2 p-2 rounded-lg transition-all duration-200
                              /* Мобильные настройки (до 1024px) */
                              opacity-100 text-gray-400 bg-gray-50/50 border-gray-100 border
                              active:bg-red-50 active:text-red-600
                              
                              /* Десктопные настройки (от 1024px) */
                              lg:opacity-0 lg:group-hover:opacity-100 lg:bg-transparent lg:border-transparent
                              lg:hover:text-red-600 lg:hover:bg-white lg:hover:border-red-100 lg:hover:shadow-sm
                          `}
                          title="Удалить чат"
                      >
                          <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </nav>

          </motion.div>

          {/* ИНФОРМАЦИЯ О СИСТЕМЕ */}
          {showHistory && (<motion.div variants={itemVariants} className="pt-4 border-t border-gray-100">
             <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Status</span>
                  <div className={`w-2 h-2 rounded-full ${healthStatus.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <p className="text-sm font-bold text-gray-700 truncate">{model}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 uppercase">Messages</span>
                  <span className="text-xs font-black text-blue-600">{messageCount}</span>
                </div>
             </div>
          </motion.div>)}

          {/* НИЖНЯЯ ПАНЕЛЬ: ПРОФИЛЬ И ВЫХОД (ТОЛЬКО МОБИЛЬНЫЕ) */}
          <motion.div 
            variants={itemVariants} 
            className="lg:hidden border-t border-gray-100 pt-6 mt-4 space-y-3"
          >
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">
              Аккаунт
            </h2>
            
            <div className="flex flex-col gap-2">
              {/* Кнопка Профиля */}
              <Link
                href={route('my-account.show')}
                onClick={onClose}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-100 font-bold transition-all active:scale-95 hover:bg-gray-100"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                  <IoPersonOutline className="w-4 h-4 text-blue-500" />
                </div>
                <span>Мой профиль</span>
              </Link>

              {/* Кнопка Выхода */}
              <button
                onClick={() => {
                  onClose();
                  setChatIdToLogout(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-red-50/50 text-red-600 rounded-xl border border-red-100/50 font-bold transition-all active:scale-95 hover:bg-red-100/50"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm border border-red-100/50 text-red-500">
                  <RiLogoutBoxLine className="w-4 h-4" />
                </div>
                <span>Выйти</span>
              </button>
            </div>
          </motion.div>

        </div>
        
        {/* КНОПКИ УПРАВЛЕНИЯ */}
        <motion.div variants={itemVariants} className="p-6 border-t border-gray-200 space-y-2">
          <button onClick={onRefreshStatus} className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-black text-blue-600 hover:bg-blue-50 rounded-lg transition-colors uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed">
            <RxUpdate className="w-4 h-4" /> Sync Status
          </button>
        </motion.div>
      </motion.div>

    <Transition show={chatIdToDelete !== null} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setChatIdToDelete(null)}>
      {/* 1. Оверлей  */}
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/30 transition-opacity" />
      </TransitionChild>

      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          
          {/* 2. Сама панель */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150" 
            enterFrom="opacity-0 translate-y-2 sm:scale-95" 
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-100" 
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
              
              <button
                onClick={() => setChatIdToDelete(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 outline-none p-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <IoMdClose className="h-6 w-6" />
              </button>

              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <RiDeleteBinLine className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    {/* Заголовок  */}
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Удалить чат?
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Все сообщения в этом чате будут безвозвратно удалены. Вы уверены?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-0 sm:w-auto transition-colors cursor-pointer disabled:cursor-not-allowed"
                  onClick={handleConfirmDelete}
                >
                  Удалить
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setChatIdToDelete(null)}
                >
                  Отмена
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
      </Dialog>
    </Transition>
    <LogoutModal 
      isOpen={chatIdToLogout} 
      onClose={() => setChatIdToLogout(false)} 
      />
    </>
  );
};

export default Sidebar;

