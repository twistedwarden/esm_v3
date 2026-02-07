# WebSocket Real-Time Updates - Usage Example

This example shows how to integrate real-time WebSocket updates into a dashboard component.

## Example: Dashboard Metrics Component

```typescript
import { useState, useEffect } from 'react';
import useRealtimeMetrics from '@/hooks/useRealtimeMetrics';
import monitoringService from '@/services/monitoringService';

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initial data fetch
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await monitoringService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  // Subscribe to real-time updates
  const { isConnected, lastUpdate } = useRealtimeMetrics(
    ['application', 'financial'], // Only listen to these metric types
    (event) => {
      console.log('📊 Real-time update received:', event.type);
      
      // Update metrics based on event type
      if (event.type === 'application') {
        setMetrics((prev: any) => ({
          ...prev,
          applications: {
            ...prev?.applications,
            ...event.data,
          },
        }));
      } else if (event.type === 'financial') {
        setMetrics((prev: any) => ({
          ...prev,
          financial: {
            ...prev?.financial,
            ...event.data,
          },
        }));
      }
    },
    (alert) => {
      // Handle alerts
      console.warn('🚨 Alert received:', alert.title);
      // Show toast notification
      // toast.error(alert.message, { severity: alert.severity });
    }
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Connection indicator */}
      <div className="connection-status">
        {isConnected ? (
          <span className="text-green-600">● Live</span>
        ) : (
          <span className="text-gray-400">○ Offline</span>
        )}
      </div>

      {/* Display metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Applications</h3>
          <p className="text-3xl">{metrics?.applications?.total_applications || 0}</p>
          {lastUpdate?.type === 'application' && (
            <span className="text-xs text-green-600">Just updated</span>
          )}
        </div>

        <div className="metric-card">
          <h3>Budget Remaining</h3>
          <p className="text-3xl">
            ₱{(metrics?.financial?.remaining_budget || 0).toLocaleString()}
          </p>
        </div>

        {/* More metric cards... */}
      </div>
    </div>
  );
}
```

## Example: Alerts Panel

```typescript
import { useState } from 'react';
import useRealtimeMetrics from '@/hooks/useRealtimeMetrics';

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useRealtimeMetrics(
    null, // Listen to all metric types
    undefined, // No metrics handler
    (alert) => {
      // Add new alert to the list
      setAlerts((prev) => [
        {
          id: Date.now(),
          ...alert,
        },
        ...prev,
      ]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 5000);
    }
  );

  return (
    <div className="alerts-container">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`alert alert-${alert.severity}`}
        >
          <strong>{alert.title}</strong>
          <p>{alert.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## Testing the WebSocket Connection

1. **Check browser console** for connection status:
   - ✅ "WebSocket connected to monitoring service"
   - ❌ "WebSocket disconnected from monitoring service"

2. **Test real-time updates** by posting a snapshot:
   ```bash
   curl -X POST http://localhost:8003/api/internal/analytics/application-snapshot \
     -H "Content-Type: application/json" \
     -d '{
       "snapshot_date": "2026-02-07",
       "applications": {
         "total": 1500,
         "by_status": {"approved": 800, "pending": 300},
         "by_type": {"new": 1000, "renewal": 500}
       }
     }'
   ```

3. **Verify the dashboard updates** without refreshing the page.
