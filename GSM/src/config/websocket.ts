import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher;

/**
 * WebSocket Configuration for Real-Time Monitoring Updates
 * 
 * Connects to the monitoring service WebSocket server using Laravel Echo and Pusher.
 * 
 * Usage:
 * ```typescript
 * import echo from '@/config/websocket';
 * 
 * // Subscribe to analytics channel
 * echo.channel('analytics')
 *   .listen('.metrics.updated', (event) => {
 *     console.log('Metrics updated:', event);
 *   });
 * ```
 */
export const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local_monitoring_key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
    wsPort: import.meta.env.VITE_PUSHER_PORT ? parseInt(import.meta.env.VITE_PUSHER_PORT) : undefined,
    wssPort: import.meta.env.VITE_PUSHER_PORT ? parseInt(import.meta.env.VITE_PUSHER_PORT) : undefined,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
});

// Make Echo available globally for debugging
window.Echo = echo;

// Log connection status
echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ WebSocket connected to monitoring service');
});

echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ WebSocket disconnected from monitoring service');
});

echo.connector.pusher.connection.bind('error', (err: any) => {
    console.error('WebSocket connection error:', err);
});

export default echo;
