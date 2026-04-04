import { Fragment, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { FileText, FolderPlus, Loader2, Upload } from 'lucide-react';

interface Props {
    categories: string[];
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadDocumentModal({ categories, isOpen, onClose }: Props) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [isNewCategory, setIsNewCategory] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
        category: '',
        new_category: '',
    });

    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        post(route('admin.kb.upload'), {
            onSuccess: () => {
                onClose();
                reset();
                setIsNewCategory(false);
            },
        });
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Оптимизированный оверлей */}
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
                        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all dark:bg-neutral-900 text-left">
                            <button 
                                onClick={onClose} 
                                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none"
                            >
                                <IoMdClose size={24} />
                            </button>
                            
                            <DialogTitle as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                Загрузить документ
                            </DialogTitle>

                            <form onSubmit={submit} className="space-y-5">
                                {/* Выбор файла */}
                                <div 
                                    onClick={() => fileInput.current?.click()}
                                    className={`relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${data.file ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-primary'}`}
                                >
                                    <input type="file" ref={fileInput} hidden onChange={e => setData('file', e.target.files?.[0] || null)} />
                                    {data.file ? (
                                        <div className="flex flex-col items-center">
                                            <FileText className="text-primary mb-1" size={28} />
                                            <span className="text-xs font-bold text-gray-700 truncate max-w-50">{data.file.name}</span>
                                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">{(data.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="text-gray-400 mb-1" size={24} />
                                            <span className="text-xs font-medium text-gray-500">Нажмите для выбора файла</span>
                                        </div>
                                    )}
                                </div>
                                {errors.file && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{errors.file}</p>}

                                {/* Выбор категории */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Категория (папка)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsNewCategory(!isNewCategory); reset('category', 'new_category'); }}
                                            className="text-[10px] font-bold text-primary uppercase underline cursor-pointer outline-none"
                                        >
                                            {isNewCategory ? 'К списку' : '+ Новая папка'}
                                        </button>
                                    </div>

                                    {isNewCategory ? (
                                        <input 
                                            type="text" 
                                            placeholder="Название новой папки..."
                                            value={data.new_category}
                                            onChange={e => setData('new_category', e.target.value)}
                                            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700"
                                        />
                                    ) : (
                                        <select 
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700"
                                        >
                                            <option value="">Выберите папку...</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    )}
                                    {(errors.category || errors.new_category) && (
                                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.category || errors.new_category}</p>
                                    )}
                                </div>

                                <button 
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                    Начать обработку
                                </button>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

