import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import AuthenticatedChatLayout from '@/layouts/AuthenticatedChatLayout';
import { 
    IoPersonOutline, 
    IoMailOutline, 
    IoKeyOutline, 
    IoTrashOutline, 
    IoCreateOutline,
    IoShieldCheckmarkOutline,
    IoHardwareChipOutline,
    IoAlertCircleOutline 
} from "react-icons/io5";
import { IoMdClose } from 'react-icons/io';
import UpdateProfileModal from './UpdateProfileModal';
import UpdatePasswordModal from './UpdatePasswordModal';
import DeleteUserModal from './DeleteUserModal';
import DeleteAvatarModal from './DeleteAvatarModal';

export default function Show() {
    const { auth, ollamaStatus, ai_model } = usePage<any>().props;
    const user = auth.user;
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAvatarModalOpen, setIsDeleteAvatarModalOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const fileInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        avatar: null as File | null,
    });

    const handleAvatarClick = () => fileInput.current?.click();

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
            if (file) {
                // Мы не можем передать файл вторым аргументом в post(), 
                // поэтому сначала кладем его в data через setData
                setData('avatar', file);
            }
    };

    useEffect(() => {
        if (data.avatar) {
            post(route('my-account.avatar-upload'), {
                forceFormData: true,
                preserveScroll: true,
                only: ['auth', 'errors', 'ollamaStatus'], 
                onSuccess: () => setData('avatar', null),
            });
        }
    }, [data.avatar]);

    useEffect(() => {
        if (errors.avatar) {
            const timer = setTimeout(() => {
                clearErrors('avatar');
            }, 4000); // 4 секунды

            return () => clearTimeout(timer);
        }
    }, [errors.avatar]);

    // 2. Логика подтягивания Lazy-данных 
    useEffect(() => {
        if (!ollamaStatus) {
            console.log('Profile: Запрашиваю статус Ollama...');
            router.reload({ 
                only: ['ollamaStatus'],
    
            });
        }
    }, []);

    return (
        <AuthenticatedChatLayout showHistory={false} ai_model={ai_model}>
            <Head title="Профиль" />
            
            <div className="max-w-3xl mx-auto py-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                >
                    {/* Хедер профиля */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-none">
                                Профиль
                            </h1>
                            <p className="text-sm md:text-base text-gray-500">
                                Управляйте данными и безопасностью
                            </p>
                        </div>
                        
                        <div className="flex sm:justify-end">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] md:text-xs font-bold border border-green-100 shadow-xs shadow-green-100/50">
                                <IoShieldCheckmarkOutline className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wider">Активен</span>
                            </div>
                        </div>
                    </div>


                    {/* Главная карточка */}
                    <div className="bg-white rounded-[2.5rem] py-8 px-14 shadow-xl shadow-gray-100/50 border border-gray-50 relative overflow-hidden">
                        {/* Декоративный фон */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <IoPersonOutline className="w-48 h-48 text-blue-900" />
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            {/* Секция Аватара */}
                            <div className="relative group">
                            {/* Основная зона клика для загрузки */}
                            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                                <input 
                                    type="file" 
                                    ref={fileInput} 
                                    className="hidden" 
                                    onChange={onFileChange} 
                                    accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp" 
                                />
                                
                                {processing && (
                                    <div className="absolute inset-0 z-20 bg-black/40 rounded-3xl flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {user.avatar && !imgError ? (
                                    <img 
                                        src={`/storage/${user.avatar}`} 
                                        alt={`${user.name || 'Пользователь'}`} 
                                        onError={() => setImgError(true)} 
                                        className="w-24 h-24 rounded-3xl object-cover shadow-lg border-2 border-white group-hover:opacity-80 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-linear-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform text-white">
                                        <IoPersonOutline className="w-12 h-12" />
                                    </div>
                                )}
                                
                                {/* Кнопка "Изменить" (карандаш) */}
                                <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-md border border-gray-100 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all z-10">
                                    <IoCreateOutline className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Кнопка "Удалить" (крестик) — показываем только если есть аватар */}
                            {user.avatar && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsDeleteAvatarModalOpen(true); 
                                    }}
                                    className="absolute -top-2 -right-2 p-1.5 bg-white rounded-lg shadow-md border border-red-50 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all z-10"
                                    title="Удалить фото"
                                >
                                    <IoMdClose className="w-4 h-4" />
                                </button>
                            )}
                        {errors.avatar && (
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-30 w-max max-w-45">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-50 border-t border-l border-red-100 rotate-45" />
                                
                                {/* Само сообщение */}
                                <div className="relative bg-red-50 text-red-600 px-3 py-2 rounded-xl border border-red-100 shadow-lg shadow-red-200/50 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center gap-1.5">
                                        <IoAlertCircleOutline className="w-3.5 h-3.5 shrink-0" />
                                        <p className="text-[10px] leading-tight font-black uppercase tracking-tight">
                                            {errors.avatar}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>


                            {/* Основная инфо */}
                            <div className="text-center md:text-left flex-1">
                                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                                <div className="flex flex-col md:flex-row gap-3 md:gap-6 mt-3 text-gray-500">
                                    <div className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50">
                                        <IoMailOutline className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium">{user.email}</span>
                                    </div>
                                    
                                <div className="flex items-center justify-center md:justify-start gap-2 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/30">
                                    <div className={`w-2 h-2 rounded-full ${
                                        ollamaStatus?.status === 'online' 
                                            ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' 
                                            : ollamaStatus?.status === 'down'
                                                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                                : 'bg-amber-400 animate-pulse'
                                    }`} />
                                    <span className="text-sm font-bold text-blue-600/80 uppercase tracking-wider flex items-center gap-1">
                                        <IoHardwareChipOutline className="w-3.5 h-3.5" />
                                        AI: {
                                            ollamaStatus?.status === 'online' 
                                                ? (ollamaStatus?.model || 'Загрузка...') 
                                                : ollamaStatus?.status === 'down' 
                                                    ? 'Offline' 
                                                    : 'Проверка...'
                                        }
                                    </span>
                                </div>

                                </div>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                            <button 
                            onClick={() => setIsProfileModalOpen(true)}
                            className="cursor-pointer flex items-center justify-center gap-3 py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-bold transition-all active:scale-95 group border border-blue-100/50">
                                <IoCreateOutline className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Изменить данные
                            </button>

                            <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="cursor-pointer flex items-center justify-center gap-3 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-bold transition-all active:scale-95 group border border-indigo-100/50">
                                <IoKeyOutline className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                                Безопасность
                            </button>

                            <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="cursor-pointer flex items-center justify-center gap-3 py-4 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-bold transition-all active:scale-95 group border border-red-100/50">
                                <IoTrashOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Удалить аккаунт
                            </button>
                        </div>
                    </div>

                    {/* Подвал с системной инфо */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="p-6 bg-linear-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-sm"
                        >
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-blue-400 rounded-full" />
                                Безопасность
                            </h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Ваши данные защищены. Мы рекомендуем использовать пароли длиной более 8 символов.
                            </p>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="p-6 bg-linear-to-br from-blue-50/30 to-indigo-50/30 rounded-3xl border border-blue-100/50 shadow-sm"
                        >
                            <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-indigo-400 rounded-full" />
                                AI Ассистент
                            </h4>
                            <p className="text-sm text-blue-600/70 leading-relaxed min-h-10"> 
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={ollamaStatus?.status || 'loading'}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className="block"
                                    >
                                        {ollamaStatus?.status === 'online' && (
                                            <>Искусственный интеллект <b>подключен</b> и готов к работе с вашими чатами в режиме реального времени.</>
                                        )}
                                        {ollamaStatus?.status === 'down' && (
                                            <>К сожалению, сервис ИИ сейчас <b>недоступен</b>. Приносим извинения за временные неудобства.</>
                                        )}
                                        {!ollamaStatus?.status && (
                                            <><b>Ожидание ответа...</b> Проверяем статус подключения искусственного интеллекта.</>
                                        )}
                                    </motion.span>
                                </AnimatePresence>
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            <UpdateProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                user={user} 
            />
            <UpdatePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
            <DeleteUserModal
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
            />
            <DeleteAvatarModal 
                isOpen={isDeleteAvatarModalOpen} 
                onClose={() => setIsDeleteAvatarModalOpen(false)} 
            />
        </AuthenticatedChatLayout>
    );
}


