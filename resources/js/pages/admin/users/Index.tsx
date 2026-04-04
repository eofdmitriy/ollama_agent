import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, User } from '@/types'; 
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import { MessageSquare, Edit2, Trash2, Search } from 'lucide-react';
import AdminDeleteUserModal from './AdminDeleteUserModal';
import EditUserModal from './EditUserModal';

interface Props {
    users: {
        data: any[]; 
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search: string;
    };
}

export default function Index({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Users', href: route('admin.users.index') },
    ];

    const handleSearch = useCallback(
        debounce((query: string) => {
            router.get(route('admin.users.index'), { search: query }, { 
                preserveState: true, 
                replace: true 
            });
        }, 300),
        []
    );

    useEffect(() => {
        handleSearch(search);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin - Users" />
            
            <div className="flex flex-col gap-4 p-4 md:gap-6 lg:p-8">
                {/* Шапка и Поиск */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-xl font-bold tracking-tight">Управление пользователями</h1>
                    
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Поиск по имени и email..."
                            className="w-full rounded-xl border border-sidebar-border/70 bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- ТАБЛИЦА (только для md и выше) --- */}
                <div className="hidden overflow-hidden rounded-xl border border-sidebar-border/70 bg-background md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-4 font-medium text-muted-foreground">Пользователь</th>
                                <th className="p-4 font-medium text-muted-foreground">Email</th>
                                <th className="p-4 font-medium text-muted-foreground text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/70">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                            {user.avatar ? (
                                                <img src={`/storage/${user.avatar}`} alt="" className="size-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-primary">{user.name[0]}</span>
                                            )}
                                        </div>
                                       <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${user.deleted_at ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                {user.name}
                                            </span>
                                            
                                            {user.deleted_at && (
                                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded">
                                                    Удален
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <Link href={route('admin.users.chats', user.id)} className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors" title="Чаты"><MessageSquare size={18}/></Link>
                                            <button onClick={() => openEditModal(user)} className="rounded-md p-2 text-amber-600 hover:bg-amber-50 cursor-pointer disabled:cursor-not-allowed" title="Редактировать"><Edit2 size={18}/></button>
                                            <button onClick={() => openDeleteModal(user)} className="rounded-md p-2 text-destructive hover:bg-destructive/10 cursor-pointer disabled:cursor-not-allowed" title="Удалить"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- КАРТОЧКИ (только для мобильных устройств) --- */}
                <div className="flex flex-col gap-3 md:hidden">
                    {users.data.map((user) => (
                        <div key={user.id} className="rounded-2xl border border-sidebar-border/70 bg-background p-4 shadow-sm active:scale-[0.98] transition-transform">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                    {user.avatar ? (
                                        <img src={`/storage/${user.avatar}`} alt="" className="size-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-primary">{user.name[0]}</span>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-foreground truncate">{user.name}</span>
                                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 border-t border-sidebar-border/50 pt-3">
                                <Link 
                                    href={route('admin.users.chats', user.id)} 
                                    className="flex items-center justify-center h-10 rounded-xl bg-primary/5 text-primary active:bg-primary/20"
                                >
                                    <MessageSquare size={18} />
                                </Link>
                                <button 
                                    onClick={() => openEditModal(user)} 
                                    className="flex items-center justify-center h-10 rounded-xl bg-amber-50 text-amber-600 active:bg-amber-100 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => openDeleteModal(user)} 
                                    className="flex items-center justify-center h-10 rounded-xl bg-destructive/5 text-destructive active:bg-destructive/10 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Пагинация (адаптивная: скрываем лишние ссылки на мобилках через CSS в AppLayout или делаем компактной здесь) */}
                <div className="flex flex-wrap justify-center gap-1 py-4">
                    {users.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || ''}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            onClick={(e) => !link.url && e.preventDefault()}
                            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm border transition-colors ${
                                link.active 
                                ? 'bg-primary text-primary-foreground border-primary font-bold' 
                                : 'bg-background hover:bg-muted text-foreground border-sidebar-border/70'
                            } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                        />
                    ))}
                </div>
            </div>

            <AdminDeleteUserModal user={userToDelete} isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
            <EditUserModal user={userToEdit} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
        </AppLayout>
    );
}
