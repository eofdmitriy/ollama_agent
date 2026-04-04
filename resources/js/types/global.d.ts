import { Config, RouteName, RouteParams } from 'ziggy-js';
import type { Auth } from '@/types/auth';
import Echo from 'laravel-echo';

declare global {
    interface Window {
        Echo: Echo; 
    }

    function route(
        name?: RouteName,
        params?: RouteParams,
        absolute?: boolean,
        config?: Config
    ): string;
}

declare module '@inertiajs/core' {
    interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

