import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { AlertTriangle, ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
    doc: { id: number; title: string } | null;
    type: 'block' | 'force-delete' | 'restore' | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocActionModal({ doc, type, isOpen, onClose }: Props) {
    
    const config = {
        'block': {
            title: 'Заблокировать?',
            btnText: 'Заблокировать',
            btnClass: 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600',
            icon: <ShieldAlert className="h-5 w-5" />,
            iconClass: 'bg-amber-500/10 text-amber-500',
            route: route('admin.kb.destroy', doc?.id || 0),
            method: 'delete' as const,
            desc: 'Документ перестанет использоваться в базе знаний.'
        },
        'force-delete': {
            title: 'Удалить навсегда?',
            btnText: 'Удалить всё',
            btnClass: 'bg-destructive shadow-destructive/20 hover:bg-destructive/90',
            icon: <AlertTriangle className="h-5 w-5" />,
            iconClass: 'bg-destructive/10 text-destructive',
            route: route('admin.kb.force-delete', doc?.id || 0),
            method: 'delete' as const,
            desc: 'Это действие необратимо. Файл и векторы будут стерты.'
        },
        'restore': {
            title: 'Разблокировать?',
            btnText: 'Восстановить',
            btnClass: 'bg-primary shadow-primary/20 hover:bg-primary/90',
            icon: <RotateCcw className="h-5 w-5" />,
            iconClass: 'bg-primary/10 text-primary',
            route: route('admin.kb.restore', doc?.id || 0),
            method: 'post' as const,
            desc: 'Документ снова станет актуальным для ответов ИИ.'
        }
    };

    const current = type ? config[type] : null;

    const confirm = () => {
        if (!doc || !current) return;
        const options = { 
            onSuccess: () => onClose(), 
            preserveScroll: true,
            // Добавляем для более плавного перехода
            preserveState: true 
        };
        
        if (current.method === 'delete') router.delete(current.route, options);
        else router.post(current.route, {}, options);
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-60" onClose={onClose}>
                {/* Оптимизированный фон: меньше блюра + аппаратное ускорение */}
                <TransitionChild 
                    as={Fragment} 
                    enter="ease-out duration-150" 
                    enterFrom="opacity-0" 
                    enterTo="opacity-100" 
                    leave="ease-in duration-100" 
                    leaveFrom="opacity-100" 
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transform-gpu" />
                </TransitionChild>

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <TransitionChild 
                        as={Fragment} 
                        enter="ease-out duration-200" 
                        enterFrom="opacity-0 scale-95" 
                        enterTo="opacity-100 scale-100" 
                        leave="ease-in duration-150" 
                        leaveFrom="opacity-100 scale-100" 
                        leaveTo="opacity-0 scale-95"
                    >
                        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-7 text-left shadow-2xl transition-all dark:bg-neutral-900">
                            <button 
                                onClick={onClose} 
                                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none"
                            >
                                <IoMdClose size={22} />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${current?.iconClass}`}>
                                    {current?.icon}
                                </div>
                                <DialogTitle as="h3" className="text-lg font-bold text-gray-900 dark:text-white">
                                    {current?.title}
                                </DialogTitle>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Документ: <span className="font-semibold text-foreground italic">«{doc?.title}»</span>.
                                    <br />{current?.desc}
                                </p>
                            </div>

                            <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                                <button 
                                    onClick={onClose} 
                                    className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={confirm} 
                                    className={`rounded-xl px-5 py-2 text-sm font-bold text-white transition-all active:scale-95 shadow-lg ${current?.btnClass} cursor-pointer disabled:opacity-50`}
                                >
                                    {current?.btnText}
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
