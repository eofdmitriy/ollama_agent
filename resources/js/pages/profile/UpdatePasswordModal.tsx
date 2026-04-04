import { Fragment, useRef } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoCloseOutline, IoKeyOutline, IoLockClosedOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdatePasswordModal({ isOpen, onClose }: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        patch(route('my-account.password-change'), { 
            preserveScroll: true,
            only: ['auth', 'errors', 'ollamaStatus'], 
            onSuccess: () => {
                reset();
                setTimeout(() => onClose(), 1000);
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
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                            <DialogPanel className="relative transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="absolute top-0 right-0 p-8">
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                        <IoCloseOutline className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="p-10">
                                    <DialogTitle as="h3" className="text-2xl font-black text-gray-800 mb-2">
                                        Безопасность
                                    </DialogTitle>
                                    <p className="text-gray-500 text-sm mb-8 font-medium">Обновите пароль для защиты аккаунта</p>

                                    <div className="space-y-6">
                                        {/* Текущий пароль */}
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Текущий пароль</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoLockClosedOutline className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    ref={currentPasswordInput}
                                                    type="password"
                                                    value={data.current_password}
                                                    onChange={(e) => setData('current_password', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            {errors.current_password && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1"> {getErrorMessage(errors.current_password)}</p>}
                                        </div>

                                        {/* Новый пароль */}
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Новый пароль</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoKeyOutline className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    ref={passwordInput}
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="Минимум 8 символов"
                                                />
                                            </div>
                                            {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{getErrorMessage(errors.password)}</p>}
                                        </div>

                                        {/* Подтверждение */}
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Подтверждение</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoShieldCheckmarkOutline className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
                                                    placeholder="Повторите новый пароль"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex items-center justify-between">
                                        <div className="flex-1">
                                            {recentlySuccessful && (
                                                <div className="flex items-center gap-2 text-green-500 font-bold text-sm animate-bounce">
                                                    <IoShieldCheckmarkOutline className="w-5 h-5" />
                                                    Пароль изменен!
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-4">
                                            <button type="submit" disabled={processing} className="px-10 py-4 bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-[1.25rem] font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 tracking-wide uppercase text-xs">
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
