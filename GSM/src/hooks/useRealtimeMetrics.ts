import { useEffect, useState, useCallback } from 'react';
import echo from '@/config/websocket';

export interface MetricsUpdateEvent {
    type: string;
    data: any;
    timestamp: string;
}

export interface AlertEvent {
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    context: any;
    timestamp: string;
}

/**
 * React hook for subscribing to real-time metrics updates
 * 
 * @param metricTypes - Array of metric types to listen for (e.g., ['application', 'financial'])
 * @param onUpdate - Callback function when metrics are updated
 * @param onAlert - Optional callback function when alerts are received
 * 
 * @example
 * ```typescript
 * const { isConnected, lastUpdate } = useRealtimeMetrics(
 *   ['application', 'financial'],
 *   (event) => {
 *     console.log('Metrics updated:', event);
 *     setMetrics(event.data);
 *   },
 *   (alert) => {
 *     toast.error(alert.message);
 *   }
 * );
 * ```
 */
export function useRealtimeMetrics(
    metricTypes: string[] | null = null,
    onUpdate?: (event: MetricsUpdateEvent) => void,
    onAlert?: (alert: AlertEvent) => void
) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<MetricsUpdateEvent | null>(null);
    const [lastAlert, setLastAlert] = useState<AlertEvent | null>(null);

    const handleMetricsUpdate = useCallback((event: MetricsUpdateEvent) => {
        // Filter by metric type if specified
        if (metricTypes === null || metricTypes.includes(event.type)) {
            setLastUpdate(event);
            onUpdate?.(event);
        }
    }, [metricTypes, onUpdate]);

    const handleAlert = useCallback((event: AlertEvent) => {
        setLastAlert(event);
        onAlert?.(event);
    }, [onAlert]);

    useEffect(() => {
        // Subscribe to analytics channel
        const channel = echo.channel('analytics');

        // Listen for metrics updates
        channel.listen('.metrics.updated', handleMetricsUpdate);

        // Listen for alerts
        channel.listen('.alert.created', handleAlert);

        // Track connection status
        const handleConnected = () => setIsConnected(true);
        const handleDisconnected = () => setIsConnected(false);

        echo.connector.pusher.connection.bind('connected', handleConnected);
        echo.connector.pusher.connection.bind('disconnected', handleDisconnected);

        // Set initial connection state
        setIsConnected(echo.connector.pusher.connection.state === 'connected');

        // Cleanup on unmount
        return () => {
            channel.stopListening('.metrics.updated', handleMetricsUpdate);
            channel.stopListening('.alert.created', handleAlert);
            echo.connector.pusher.connection.unbind('connected', handleConnected);
            echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
            echo.leaveChannel('analytics');
        };
    }, [handleMetricsUpdate, handleAlert]);

    return {
        isConnected,
        lastUpdate,
        lastAlert,
    };
}

export default useRealtimeMetrics;
