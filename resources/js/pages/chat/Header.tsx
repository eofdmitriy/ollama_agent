import React, {useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineLightBulb } from 'react-icons/hi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link } from '@inertiajs/react'; 
import { IoPersonOutline } from "react-icons/io5"; 
import { RiLogoutBoxLine } from "react-icons/ri";   
import LogoutModal from './LogoutModal';

interface HeaderProps {
  title?: string;
  // Меняем типы статуса под те, что приходят из OllamaService
  status?: 'online' | 'down' | 'loading';
  onToggleSidebar: () => void;
  ai_model?: string;
  showHistory?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title = "Ollama Chat Assistant",
  status = 'down',
  onToggleSidebar,
  ai_model,
  showHistory = true,
}) => {

  const aiName = ai_model;
  const [chatIdToLogout, setChatIdToLogout] = useState(false);


  return (
    <>
    <header className="bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-lg shrink-0">
      <div className="mx-auto px-4 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5">
        <div className="flex items-center justify-between">
          
          {/* Левый блок: логотип и информация */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Логотип ведет на главную (создание нового чата) */}
            <Link 
              href={route('chats.index')} 
              className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <HiOutlineLightBulb className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </Link>
            
            {/* Заголовок и статус */}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold sm:text-xl md:text-2xl mb-0.5 leading-tight">
                {showHistory ? `${title}` : 'Профиль'}
              </h1>
              
              {/* Статус модели */}
            <div className="flex items-center space-x-3 h-6">
                <div className="relative flex items-center justify-center w-3 h-3">
                    {/* 1. Внешнее свечение (Glow) с AnimatePresence для смены цвета */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 0.5 }}
                            className={`absolute inset-0 rounded-full blur-[3px] ${
                                status === 'online' ? 'bg-green-400/40' : 
                                status === 'loading' ? 'bg-amber-400/40' : 'bg-red-400/40'
                            }`}
                        />
                    </AnimatePresence>

                    {/* 2. Основная точка с эффектом Pulse для Online */}
                    <motion.div 
                        animate={{
                            backgroundColor: status === 'online' ? '#4ade80' : status === 'loading' ? '#fbbf24' : '#f87171',
                        }}
                        transition={{ duration: 0.8 }}
                        className={`w-2 h-2 rounded-full z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] ${
                            status === 'online' ? 'animate-pulse' : ''
                        }`}
                    />
                    
                    {/* 3. Волна Ping только для Loading */}
                    {status === 'loading' && (
                        <div 
                            className="absolute inset-0 rounded-full animate-ping bg-amber-400 opacity-70"
                            style={{ animationDuration: '1.5s' }}
                        />
                    )}
                </div>

                {/* Блок анимированного текста */}
                <div className="overflow-hidden relative h-5 flex items-center">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={`status-text-${status}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="text-xs sm:text-sm text-blue-100 font-medium whitespace-nowrap"
                        >
                            {status === 'online' && `${aiName} активна`}
                            {status === 'down' && `${aiName} недоступна`}
                            {status === 'loading' && `${aiName}: проверка связи...`}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            </div>
          </div>

          {/* Правый блок */}
          <div className="flex items-center space-x-3">
            {/* Бейдж - виден на десктопах */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Кнопка Профиля */}
              <Link 
                  href={route('my-account.show')} 
                  className="flex items-center gap-2 text-blue-50 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-white/5"
              >
                  <IoPersonOutline className="w-4 h-4" />
                  Профиль
              </Link>

              {/* Кнопка Выхода */}
              <button 
                  onClick={() => setChatIdToLogout(true)}
                  className="flex items-center gap-2 text-red-100 bg-red-400/10 hover:bg-red-400/20 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-red-400/10 cursor-pointer"
              >
                  <RiLogoutBoxLine className="w-4 h-4 text-red-200" />
                  Выйти
              </button>
          </div>

            {/* Кнопка меню - только для мобилок */}
            <div className="lg:hidden">
              <button
                onClick={onToggleSidebar}
                className="bg-white/20 rounded-lg flex items-center justify-center active:scale-95 transition-transform min-h-11 min-w-11"
              >
                <RxHamburgerMenu className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <LogoutModal 
        isOpen={chatIdToLogout} 
        onClose={() => setChatIdToLogout(false)} 
      />
    </>
  );
};

export default Header;
