import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoCloseOutline, IoKeyOutline, IoLockClosedOutline, IoShieldCheckmarkOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdatePasswordModal({ isOpen, onClose }: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful, reset, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleClose = () => {
        reset();        
        clearErrors();  
        onClose(); 
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);    
    };

    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        patch(route('my-account.password-change'), { 
            preserveScroll: true,
            only: ['auth', 'errors', 'ollamaStatus'], 
            onSuccess: () => {
                reset();
                setTimeout(() => handleClose(), 1000);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const getErrorMessage = (error?: string) => {
        if (!error) return null;
        const e = error.toLowerCase();
        if (e.includes('current_password')) return 'Текущий пароль введен неверно'; // Добавил для Laravel
        if (e.includes('required')) return 'Это поле обязательно';
        if (e.includes('match') || e.includes('confirmation')) return 'Пароли не совпадают';
        if (e.includes('8 characters') || e.includes('least 8')) return 'Минимум 8 символов';
        return error;
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="absolute top-0 right-0 p-8">
                                    <button onClick={handleClose} className="cursor-pointer text-gray-400 hover:text-gray-500 transition-colors">
                                        <IoCloseOutline className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="p-6 sm:p-10"> 
                                    <DialogTitle as="h3" className="text-xl sm:text-2xl font-black text-gray-800 mb-2">
                                        Безопасность
                                    </DialogTitle>
                                    <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">Обновите пароль для защиты аккаунта</p>

                                    <div className="space-y-5 sm:space-y-6">
                                        {/* Текущий пароль */}
                                        <div>
                                            <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Текущий пароль</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoLockClosedOutline className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <input
                                                    ref={currentPasswordInput}
                                                    type={showCurrent ? "text" : "password"}
                                                    value={data.current_password}
                                                    onChange={(e) => setData('current_password', e.target.value)}
                                                    autoComplete="one-time-code" 
                                                    className="w-full pl-10 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm sm:text-base font-medium"
                                                    placeholder="••••••••"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowCurrent(!showCurrent)}
                                                    className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                                                >
                                                    {showCurrent ? <IoEyeOutline className="w-5 h-5" /> : <IoEyeOffOutline className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.current_password && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1"> {getErrorMessage(errors.current_password)}</p>}
                                        </div>

                                        {/* Новый пароль */}
                                        <div>
                                            <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Новый пароль</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoKeyOutline className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <input
                                                    ref={passwordInput}
                                                    type={showNew ? "text" : "password"}
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    autoComplete="new-password" 
                                                    className="w-full pl-10 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm sm:text-base font-medium"
                                                    placeholder="От 8 символов" 
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowNew(!showNew)}
                                                    className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                                                >
                                                    {showNew ? <IoEyeOutline className="w-5 h-5" /> : <IoEyeOffOutline className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{getErrorMessage(errors.password)}</p>}
                                        </div>

                                        {/* Подтверждение */}
                                        <div>
                                            <label className="block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Подтверждение</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoShieldCheckmarkOutline className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <input
                                                    type={showConfirm ? "text" : "password"}
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    autoComplete="new-password"
                                                    className="w-full pl-10 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm sm:text-base font-medium"
                                                    placeholder="Повторите пароль" 
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                                                >
                                                    {showConfirm ? <IoEyeOutline className="w-5 h-5" /> : <IoEyeOffOutline className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-between">
                                        <div className={recentlySuccessful ? "mb-4 sm:mb-0 flex-1" : "hidden sm:block flex-1"}>
                                            {recentlySuccessful && (
                                                <div className="flex items-center gap-2 text-green-500 font-bold text-sm animate-bounce">
                                                    <IoShieldCheckmarkOutline className="w-5 h-5" />
                                                    Пароль изменен!
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <button 
                                                type="submit" 
                                                disabled={processing} 
                                                className="cursor-pointer w-full sm:w-auto px-10 py-4 bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-[1.25rem] font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 tracking-wide uppercase text-xs"
                                            >
                                                {processing ? 'Синхронизация...' : 'Обновить пароль'}
                                            </button>
                                        </div>
                                    </div>

                                </form>

                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
