import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';

// ИМПОРТИРУЕМ НАПРЯМУЮ
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

// Создаем инстанс вручную - это ГАРАНТИРУЕТ наличие метода .private()
const echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

(window as any).Echo = echoInstance;

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );

        // const pageProps = props.initialPage.props as any;
        // const user = pageProps.auth?.user;

        // if (user) {
        //     // Теперь .private() точно существует
        //     echoInstance.private(`user.${user.id}`)
        //         .listen('.ChatUpdated', (e: any) => {
        //             console.log('Заголовок обновлен:', e.chat.title);
        //             router.reload({ only: ['allChats', 'currentChat'] });
        //         });
        // }
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();

