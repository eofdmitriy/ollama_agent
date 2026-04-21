import { Fragment } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { IoMdClose } from "react-icons/io";
import { RiImageLine } from "react-icons/ri"; 
import { router } from '@inertiajs/react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAvatarModal({ isOpen, onClose }: Props) {
    
    const handleConfirmDelete = () => {
        router.delete(route('my-account.avatar-remove'), {
            preserveScroll: true,
            only: ['auth', 'ollamaStatus'],
            onFinish: () => onClose(),
        });
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 transition-opacity" />
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
                            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
                                
                                <button
                                    onClick={onClose}
                                    className="cursor-pointer absolute right-4 top-4 text-gray-400 hover:text-gray-500 outline-none p-1"
                                >
                                    <IoMdClose className="h-6 w-6" />
                                </button>

                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <RiImageLine className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                                Удалить фото?
                                            </DialogTitle>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Вы уверены, что хотите удалить фото профиля? Это действие нельзя отменить.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex w-full justify-center rounded-xl bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-0 sm:w-auto transition-colors"
                                        onClick={handleConfirmDelete}
                                    >
                                        Удалить
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                                        onClick={onClose}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
