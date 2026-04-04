import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiShieldCheck, HiScale, HiLockClosed } from "react-icons/hi2";

const LegalPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
            <Head title="Правовая информация" />

            {/* HEADER / NAVIGATION */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link 
                            href={route('home', { action: 'register' })} 
                            className="group flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <HiArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Вернуться
                        </Link>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">AI</div>
                            <span className="font-bold tracking-tight hidden sm:block">Assistant</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="relative py-12 sm:py-20 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                            Юридические <span className="text-blue-600">соглашения</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-500 leading-relaxed">
                            Мы ценим ваше доверие и обеспечиваем прозрачные условия использования наших AI-технологий.
                        </p>
                    </motion.div>
                </div>
                {/* Абстрактный декор для стиля */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
            </header>

            {/* CONTENT GRID */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                    
                    {/* SIDEBAR NAVIGATION (Hidden on mobile) */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-28 space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">Содержание</p>
                            {[
                                { id: 'privacy', label: 'Конфиденциальность', icon: HiShieldCheck },
                                { id: 'terms', label: 'Условия использования', icon: HiScale },
                            ].map((item) => (
                                <a 
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="flex items-center px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all font-medium"
                                >
                                    <item.icon className="mr-3 w-5 h-5 opacity-70" />
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </aside>

                    {/* TEXT CONTENT */}
                    <div className="flex-1 max-w-3xl">
                        <div className="space-y-24">
                            
                            {/* Section 1 */}
                            <section id="privacy" className="scroll-mt-28">
                                <h2 className="text-2xl sm:text-3xl font-bold mb-8 flex items-center">
                                    <span className="w-1.5 h-8 bg-blue-600 rounded-full mr-4 inline-block" />
                                    Политика конфиденциальности
                                </h2>
                                <div className="prose prose-lg text-gray-600 space-y-6">
                                    <p>Мы собираем только необходимые данные для работы AI-моделей: адрес почты и историю запросов.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-8">
                                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                            <h4 className="font-bold text-blue-900 mb-2">Хранение</h4>
                                            <p className="text-sm text-blue-800/70">Все данные хранятся на серверах в защищенном контуре.</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                                            <h4 className="font-bold text-gray-900 mb-2">Передача</h4>
                                            <p className="text-sm text-gray-500">Мы никогда не передаем ваши диалоги рекламным сетям или сторонним сервисам.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section id="terms" className="scroll-mt-28">
                                <h2 className="text-2xl sm:text-3xl font-bold mb-8 flex items-center">
                                    <span className="w-1.5 h-8 bg-blue-600 rounded-full mr-4 inline-block" />
                                    Пользовательское соглашение
                                </h2>
                                <div className="prose prose-lg text-gray-600 space-y-6">
                                    <p>Используя сервис, вы обязуетесь не нарушать авторские права и не использовать систему для генерации вредоносного контента.</p>
                                    <ul className="space-y-4 list-none pl-0">
                                        {[
                                            'Соблюдение законов вашей юрисдикции',
                                            'Ответственность за использование полученных данных'
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-start">
                                                <div className="mt-1.5 mr-3 w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                                                <span>{text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LegalPage;


