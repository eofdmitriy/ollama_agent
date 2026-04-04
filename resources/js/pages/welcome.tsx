import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiEye, HiEyeOff } from "react-icons/hi";
import { HiArrowPath } from "react-icons/hi2";


interface WelcomeProps {
    initialIsLogin: boolean;
    canRegister: boolean;
}

export default function Welcome({ initialIsLogin = true, canRegister }: WelcomeProps) {
    const [isLogin, setIsLogin] = useState(initialIsLogin);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Форма входа
    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const restoreForm = useForm({});

    const handleRestoreSubmit= (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        restoreForm.post(route('restore.perform'));
    };


    // Форма регистрации
    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '', 
        agreement: false,
    });

    const handleLoginSubmit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        loginForm.post('/login', {
            onFinish: () => loginForm.reset('password'),
        });
    };

    const handleRegisterSubmit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        registerForm.post('/register', {
            onFinish: () => registerForm.reset('password', 'password_confirmation'),
        });
    };

    const getErrorMessage = (error?: string) => {
        if (!error) return null;
        if (error.includes('credentials')) return 'Неверный email или пароль';
        if (error.includes('required')) return 'Это поле обязательно для заполнения';
        if (error.includes('email')) return 'Введите корректный адрес почты';
        if (error.includes('taken')) return 'Этот email уже занят';
        if (error.includes('password') && error.includes('confirmation')) return 'Пароли не совпадают';
        if (error.includes('at least 8 characters')) return 'Пароль должен быть не менее 8 символов';
        return error; // Если не совпало, вернем как есть
    };


    return (
        <div className="flex min-h-screen bg-gray-50 overflow-hidden">
            <Head title={isLogin ? 'Вход' : 'Регистрация'} />

            {/* ЛЕВЫЙ БЛОК: Приветствие и визуал */}
            <div className="hidden lg:flex lg:flex-1 relative bg-blue-600 items-center justify-center p-12 text-white">
                <div className="relative z-10 max-w-lg">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold leading-tight"
                    >
                        Твой персональный <br /> AI-ассистент
                    </motion.h1>
                    <p className="mt-6 text-blue-100 text-lg">
                        Общайся, создавай и решай задачи быстрее с помощью современных языковых моделей.
                    </p>
                </div>
                {/* Декоративный элемент фона */}
                <div className="absolute inset-0 opacity-10"></div>
            </div>

            {/* ПРАВЫЙ БЛОК: Формы */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {isLogin ? 'Введите свои данные для входа' : 'Заполните форму для регистрации'}
                        </p>
                    </div>
                    <AnimatePresence mode="wait">
                         {loginForm.errors.email === 'account_deleted' ? (
                            <motion.div
                                key="restore-ui"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                                    <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                                        <HiArrowPath className={`w-7 h-7 ${restoreForm.processing ? 'animate-spin' : ''}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Аккаунт найден</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Ваш профиль был удален ранее. Мы сохранили все ваши чаты и данные. 
                                        Хотите восстановить доступ к аккаунту?
                                    </p>
                                </div>

                                <form onSubmit={handleRestoreSubmit} className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={restoreForm.processing}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {restoreForm.processing ? 'Восстановление...' : 'Восстановить и войти'}
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => loginForm.clearErrors()} // Возврат к обычному входу
                                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        Отмена (войти в другой аккаунт)
                                    </button>
                                </form>
                            </motion.div>
                        ) : isLogin ? (
                            <motion.form 
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleLoginSubmit} 
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={loginForm.data.email}
                                        onChange={e => loginForm.setData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="example@mail.com"
                                    />
                                    {loginForm.errors.email && <p className="text-red-500 text-xs mt-1">{loginForm.errors.email}</p>}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? 'text' : 'password'}
                                            value={loginForm.data.password}
                                            onChange={e => loginForm.setData('password', e.target.value)}
                                            className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all outline-none
                                                ${loginForm.errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                                        />
                                        
                                        {/* Кнопка управления видимостью */}
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {showLoginPassword ? (
                                                <HiEye className="w-5 h-5" />
                                            ) : (
                                                <HiEyeOff className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {/* Сообщение об ошибке (если есть) */}
                                    {loginForm.errors.password && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">
                                            {loginForm.errors.password}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loginForm.processing}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {loginForm.processing ? 'Загрузка...' : 'Войти'}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleRegisterSubmit} 
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                    <input
                                        type="text"
                                        value={registerForm.data.name}
                                        onChange={e => registerForm.setData('name', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    {registerForm.errors.name && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">
                                            {getErrorMessage(registerForm.errors.name)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={registerForm.data.email}
                                        onChange={e => registerForm.setData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    {/* ВЫВОД РУССКОЙ ОШИБКИ */}
                                    {registerForm.errors.email && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">
                                            {getErrorMessage(registerForm.errors.email)}
                                        </p>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'} // ПЕРЕКЛЮЧЕНИЕ ТИПА
                                            value={registerForm.data.password}
                                            onChange={e => registerForm.setData('password', e.target.value)}
                                            className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all outline-none
                                                ${registerForm.errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                                        />
                                        {/* КНОПКА ГЛАЗИК */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {showPassword ? <HiEye className="w-5 h-5" /> : <HiEyeOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {/* ВЫВОД РУССКОЙ ОШИБКИ */}
                                    {registerForm.errors.password && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">
                                            {getErrorMessage(registerForm.errors.password)}
                                        </p>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'} // Используем состояние для подтверждения
                                            value={registerForm.data.password_confirmation}
                                            onChange={e => registerForm.setData('password_confirmation', e.target.value)}
                                            className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all outline-none
                                                ${registerForm.errors.password_confirmation ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                                        />
                                        {/* КНОПКА ГЛАЗИК */}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {showConfirmPassword ? <HiEye className="w-5 h-5" /> : <HiEyeOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={registerForm.data.agreement}
                                            onChange={e => registerForm.setData('agreement', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            Я согласен на{' '}
                                            <Link 
                                                href={route('legal') + '#privacy'}
                                                className="text-blue-600 hover:underline"
                                            >
                                                обработку персональных данных
                                            </Link>
                                            {' '}и с{' '}
                                            <Link 
                                                href={route('legal') + '#terms'} 
                                                className="text-blue-600 hover:underline"
                                            >
                                                политикой конфиденциальности
                                            </Link>
                                        </span>
                                    </label>
                                    {registerForm.errors.agreement && (
                                        <p className="text-red-500 text-xs mt-1 font-medium">
                                            {getErrorMessage(registerForm.errors.agreement)}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={registerForm.processing}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Создать аккаунт
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* ПЕРЕКЛЮЧАТЕЛЬ */}
                    {loginForm.errors.email !== 'account_deleted' && <div className="mt-8 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                        </button>
                    </div>}
                </div>
            </div>
        </div>
    );
}
