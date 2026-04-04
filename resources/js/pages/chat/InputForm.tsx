import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { IoIosSearch } from "react-icons/io";
import { VscSend } from "react-icons/vsc";
import type { OllamaStatus } from '@/types/chat';

const MAX_CHARACTERS = 1500;

interface InputFormProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  healthStatus: OllamaStatus;
}

const InputForm: React.FC<InputFormProps> = ({ onSendMessage, isLoading, healthStatus }) => {
  const [inputText, setInputText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Сбрасываем в 'auto', чтобы textarea "схлопнулась" до реального контента
    textarea.style.height = 'auto';

    const lineHeight = 24; // Наша фиксированная высота строки
    const padding = 20;    // Уменьшим чуть-чуть (10px сверху + 10px снизу), чтобы не раздувать
    const minHeight = lineHeight + padding; // 44px - идеальная 1 строка
    const maxHeight = lineHeight * 4 + padding; // 116px - лимит 4 строки

    // Вычисляем высоту: не меньше 44 и не больше 116
    const scrollHeight = textarea.scrollHeight;
    const nextHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${nextHeight}px`;

    // Скролл только если вышли за 4 строки
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    const count = inputText.length;
    setCharCount(count);
    setShowLimitWarning(count > MAX_CHARACTERS);
    adjustTextareaHeight();
  }, [inputText]);

  const handleSubmit = (e: React.BaseSyntheticEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const isOnline = healthStatus.status === 'online'; 
    
    if (inputText.trim() && !isLoading && charCount <= MAX_CHARACTERS && isOnline) {
      onSendMessage(inputText);
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
              charCount > MAX_CHARACTERS ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {charCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
            </span>
            {showLimitWarning && (
              <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter animate-pulse">
                ⚠ Лимит превышен
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 hidden md:block select-none">
            Shift + Enter для новой строки
          </p>
        </div>
        
        <div className="relative flex items-end gap-3">
          <div className="relative flex-1">
            <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none z-10">
              <IoIosSearch className="w-5 h-5"/>
            </div>
            
            
            <div className={`relative w-full rounded-2xl border transition-all duration-75 shadow-sm overflow-hidden ${
              healthStatus.status === 'down' 
                ? 'border-red-200 bg-red-50' 
                : 'border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white'
            }`}>
              <textarea
                ref={textareaRef}
                value={inputText}
                rows={1}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={healthStatus.status === 'down' ? 'Сервис недоступен...' : "Задайте вопрос..."}
                disabled={isLoading || healthStatus.status === 'down'}
                /* Убираем border и rounded у самой textarea, добавляем hide-scrollbar */
                className="max-lg:custom-scrollbar w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 resize-none leading-6 block scroll-smooth text-gray-700 placeholder:text-gray-400"
                style={{ 
                  minHeight: '44px', 
                  height: '44px', 
                  maxHeight: '116px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

          </div>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || charCount > MAX_CHARACTERS || healthStatus.status === 'down'}
            className="mb-0.5 h-11 w-11 sm:w-auto sm:px-6 flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 shadow-md active:scale-95 shrink-0
              bg-linear-to-br from-blue-600 to-indigo-600 text-white 
              hover:shadow-lg hover:brightness-110
              disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <VscSend className="w-5 h-5 -rotate-45 mb-0.5" />
                <span className="hidden sm:inline text-sm">Отправить</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};


export default InputForm;
