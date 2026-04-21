import { Fragment, useRef, useState } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteUserModal({ isOpen, onClose }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const handleClose = () => {
        reset();        
        clearErrors();  
        onClose(); 
        setShowPassword(false);    
    };


    const getErrorMessage = (error?: string) => {
        if (!error) return null;
        const e = error.toLowerCase();
        if (e.includes('password')) return 'Неверный пароль';
        if (e.includes('required')) return 'Введите пароль для подтверждения';
        return error;
    };

    const deleteUser = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();

        destroy(route('my-account.delete-account'), {
            preserveScroll: true,
            only: ['auth', 'errors', 'ollamaStatus'], 
            onSuccess: () => handleClose(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
    <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
            </TransitionChild>

            <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-150" 
                        enterFrom="opacity-0 translate-y-2 sm:scale-95" 
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-100" 
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    >
                        <DialogPanel className="relative transform overflow-hidden rounded-4xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                            
                            <button
                                onClick={handleClose}
                                className="cursor-pointer absolute right-6 top-6 text-gray-400 hover:text-gray-500 outline-none p-1 transition-colors"
                            >
                                <IoMdClose className="h-7 w-7" />
                            </button>

                            <form onSubmit={deleteUser}>
                                <div className="bg-white px-8 pb-6 pt-10">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 sm:mx-0">
                                            <RiDeleteBinLine className="h-8 w-8 text-red-500" />
                                        </div>
                                        <div className="mt-4 text-center sm:ml-5 sm:mt-0 sm:text-left">
                                            <DialogTitle as="h3" className="text-2xl font-black text-gray-900">
                                                Удалить аккаунт?
                                            </DialogTitle>
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-500 leading-relaxed">
                                                    Это действие необратимо. Все ваши чаты и данные будут стерты. 
                                                    Введите пароль, чтобы подтвердить удаление.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <IoLockClosedOutline className="text-gray-400 w-5 h-5" />
                                            </div>
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                ref={passwordInput}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                // Защита от автозаполнения
                                                autoComplete="one-time-code"
                                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none font-medium"
                                                placeholder="Ваш пароль"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="cursor-pointer absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <IoEyeOutline className="w-5 h-5" />
                                                ) : (
                                                    <IoEyeOffOutline className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-2 text-xs font-bold text-red-500 ml-1 italic">
                                                {getErrorMessage(errors.password)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50/50 px-8 py-6 sm:flex sm:flex-row-reverse gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="cursor-pointer inline-flex w-full justify-center rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-100 hover:bg-red-700 sm:w-auto transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {processing ? 'Удаление...' : 'Удалить навсегда'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer mt-3 inline-flex w-full justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all"
                                        onClick={handleClose}
                                    >
                                        Отмена
                                    </button>
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
