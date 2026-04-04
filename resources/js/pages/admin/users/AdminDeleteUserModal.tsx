import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";

interface Props {
    user: { id: number; name: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminDeleteUserModal({ user, isOpen, onClose }: Props) {
    const { delete: destroy, processing } = useForm();

    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        if (!user) return;

        destroy(route('admin.users.destroy', user.id), {
            onSuccess: () => onClose(),
            preserveScroll: true,
        });
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-left shadow-2xl transition-all dark:bg-neutral-900">
                            <div className="absolute top-0 right-0 p-5">
                            <button onClick={onClose} tabIndex={-1} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 outline-none focus:outline-none cursor-pointer">
                                <IoMdClose size={24} />
                            </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                                    <RiDeleteBinLine className="h-6 w-6 text-red-600" />
                                </div>
                                <DialogTitle as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                    Удалить навсегда?
                                </DialogTitle>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Вы собираетесь полностью удалить пользователя <span className="font-bold text-gray-900 dark:text-white">{user?.name}</span>. 
                                    Это действие <span className="text-red-500 font-semibold">необратимо</span>: все чаты и сообщения будут стерты из базы данных.
                                </p>
                            </div>

                            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={submit}
                                    disabled={processing}
                                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Удаление...' : 'Да, удалить полностью'}
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
