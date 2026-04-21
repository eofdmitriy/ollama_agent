import React, {useState} from 'react';

import { HiOutlineLightBulb } from 'react-icons/hi';
import { RxHamburgerMenu } from 'react-icons/rx';
import { Link } from '@inertiajs/react'; 
import { IoPersonOutline } from "react-icons/io5"; 
import { RiLogoutBoxLine } from "react-icons/ri";   
import LogoutModal from './LogoutModal';

interface HeaderProps {
  title?: string;
  // Меняем типы статуса под те, что приходят из OllamaService
  status?: 'online' | 'down'; 
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
              <div className="flex items-center space-x-2">
                <div className={`
                  w-2 h-2 rounded-full 
                  ${status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}
                `}></div>
                <span className="text-xs sm:text-sm text-blue-100 font-medium">
                  {status === 'online' ? `${aiName} активна` : `${aiName} недоступна`}
                </span>
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
