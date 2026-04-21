import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoCloseOutline, IoPersonOutline, IoMailOutline } from 'react-icons/io5';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: { name: string; email: string };
}

export default function UpdateProfileModal({ isOpen, onClose, user }: Props) {
    const { data, setData, patch, errors, processing, recentlySuccessful, reset, clearErrors } = useForm({
        name: user.name,
        email: user.email,
    });

    const handleClose = () => {
        reset();        
        clearErrors();  
        onClose();      
    };

    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        patch(route('my-account.update-info'), {
            preserveScroll: true,
            // Добавляем 'ollamaStatus' в список полей, которые Inertia должна подтянуть
            only: ['auth', 'errors', 'ollamaStatus'], 
            onSuccess: () => {
                setTimeout(() => handleClose(), 1000);
            },
        });
    };

    const getErrorMessage = (error?: string) => {
        if (!error) return null;
        const e = error.toLowerCase(); 
        if (e.includes('credentials')) return 'Неверный email или пароль';
        if (e.includes('required')) return 'Это поле обязательно для заполнения';
        if (e.includes('email')) return 'Введите корректный адрес почты';
        if (e.includes('taken')) return 'Этот email уже занят';
        return error;
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative transform overflow-hidden rounded-4xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="absolute top-0 right-0 p-6">
                                    <button onClick={handleClose} className="cursor-pointer text-gray-400 hover:text-gray-500 transition-colors">
                                        <IoCloseOutline className="w-8 h-8" />
                                    </button>
                                </div>

                                <form onSubmit={submit} className="p-8">
                                    <DialogTitle as="h3" className="text-2xl font-black text-gray-800 mb-6">
                                        Редактировать профиль
                                    </DialogTitle>

                                    <div className="space-y-5">
                                        {/* Поле Имя */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Ваше имя</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoPersonOutline className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                    placeholder="Введите имя"
                                                />
                                            </div>
                                            {errors.name && <p className="mt-1 text-sm text-red-500 ml-1">{getErrorMessage(errors.name)} </p>}
                                        </div>

                                        {/* Поле Email */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Эл. почта</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IoMailOutline className="text-gray-400 w-5 h-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                                    placeholder="example@mail.com"
                                                />
                                            </div>
                                            {errors.email && <p className="mt-1 text-sm text-red-500 ml-1">{getErrorMessage(errors.email)} </p>}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between">
                                        <div className="flex-1">
                                            {recentlySuccessful && (
                                                <p className="text-sm font-bold text-green-500 animate-pulse">✓ Данные обновлены</p>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="cursor-pointer px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="cursor-pointer px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {processing ? 'Сохранение...' : 'Сохранить'}
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
