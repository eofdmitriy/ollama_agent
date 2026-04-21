import { Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { IoMdClose } from "react-icons/io";
import { Camera } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: 'admin' | 'user';
}

interface Props {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditUserModal({ user, isOpen, onClose }: Props) {
    const { auth } = usePage().props as any; 
    const isFirstAdmin = auth.user.id === 1;
    const fileInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        role: '',
        avatar: null as File | null,
        delete_avatar: false,
        _method: 'PATCH', 
    });

    const handleClose = () => {
        reset();        
        clearErrors(); 
        onClose();      
    };

    // Заполняем форму данными юзера при открытии ИЛИ смене юзера
    useEffect(() => {
        if (isOpen && user) { 
            setData({
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: null,          
                delete_avatar: false,  
                _method: 'PATCH',
            });
        }
    }, [user, isOpen]); 



    const submit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        if (!user) return;

        post(route('admin.users.update', user.id), {
            onSuccess: () => {
                handleClose();
                reset();
            },
        });
    };

    const removePhoto = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setData(prev => ({
            ...prev,
            avatar: null,
            delete_avatar: true
        }));
    };


    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all dark:bg-neutral-900">
                            <div className="absolute top-0 right-0 p-5">
                                <button onClick={handleClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"><IoMdClose size={24} /></button>
                            </div>
                            <DialogTitle as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                Редактировать профиль
                            </DialogTitle>

                            <form onSubmit={submit} className="space-y-5">
                                {/* Загрузка аватара */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <div 
                                        onClick={() => fileInput.current?.click()}
                                        className="relative size-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                                    >
                                        {/* Приоритет: 1. Новое выбранное фото, 2. Старое фото (если не помечено к удалению), 3. Иконка */}
                                        {data.avatar ? (
                                            <img src={URL.createObjectURL(data.avatar)} className="size-full object-cover" />
                                        ) : (user?.avatar && !data.delete_avatar) ? (
                                            <img src={`/storage/${user.avatar}`} className="size-full object-cover" />
                                        ) : (
                                            <Camera className="text-gray-400 group-hover:text-primary" />
                                        )}

                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[10px] text-white font-bold uppercase">Изменить</span>
                                        </div>
                                    </div>

                                    {/* Кнопка удаления (крестик) */}
                                    {(data.avatar || (user?.avatar && !data.delete_avatar)) && (
                                        <button
                                            type="button"
                                            onClick={removePhoto}
                                            className="absolute -top-1 -right-1 z-20 flex size-6 items-center justify-center rounded-full bg-white text-destructive shadow-md border border-gray-100 hover:bg-destructive hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                                            title="Удалить фото"
                                        >
                                            <IoMdClose size={14} />
                                        </button>
                                    )}
                                </div>
                                
                                <input type="file" accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp" ref={fileInput} hidden onChange={(e) => {
                                    setData(prev => ({ ...prev, avatar: e.target.files?.[0] || null, delete_avatar: false }));
                                }} />
                                
                                {errors.avatar && <p className="text-xs text-red-500">{errors.avatar}</p>}
                                {data.delete_avatar && <p className="text-[10px] text-amber-600 font-bold uppercase">Фото будет удалено при сохранении</p>}
                            </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                                    <input 
                                        type="text" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={data.email} 
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700"
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                {isFirstAdmin && user?.id !== 1 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700">Права доступа</label>
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="user">Пользователь</option>
                                            <option value="admin">Администратор</option>
                                        </select>
                                        {errors.role && <div className="text-red-500 text-xs mt-1">{errors.role}</div>}
                                    </div>
                                )}

                                <div className="mt-8 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={handleClose} 
                                        className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        disabled={processing} 
                                        className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
