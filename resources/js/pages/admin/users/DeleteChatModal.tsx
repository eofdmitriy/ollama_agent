import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { AlertTriangle } from "lucide-react";

interface Props {
    chat: { id: number; title: string } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteChatModal({ chat, isOpen, onClose }: Props) {
    const confirmDelete = () => {
        if (!chat) return;
        
        router.delete(route('admin.chats.destroy', chat.id), {
            onSuccess: () => onClose(),
            preserveScroll: true,
        });
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-60" onClose={onClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-7 text-left shadow-2xl transition-all dark:bg-neutral-900">
                            <div className="absolute top-0 right-0 p-5">
                                <button 
                                    onClick={onClose} 
                                    tabIndex={-1} 
                                    className="text-gray-400 hover:text-gray-500 transition-colors outline-none focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <IoMdClose size={22} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-destructive">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <DialogTitle as="h3" className="text-lg font-bold">Удалить чат?</DialogTitle>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Вы уверены, что хотите удалить чат <span className="font-semibold text-foreground italic">«{chat?.title || 'Без названия'}»</span>? 
                                </p>
                            </div>

                            <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                                <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer disabled:cursor-not-allowed">Отмена</button>
                                <button onClick={confirmDelete} className="rounded-xl bg-destructive px-5 py-2 text-sm font-bold text-white hover:bg-destructive/90 transition-all active:scale-95 shadow-lg shadow-destructive/20 cursor-pointer disabled:cursor-not-allowed">
                                    Да, удалить
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
