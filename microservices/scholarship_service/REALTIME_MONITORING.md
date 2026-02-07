# Real-Time Monitoring Implementation

## Overview

The monitoring system now supports **true real-time updates** through event-based data synchronization. When critical events occur in the scholarship service (application submission, approval, rejection, fund release), the monitoring data is immediately synced and broadcast via WebSocket to all connected dashboard clients.

## How It Works

### 1. Event-Based Triggering

Instead of waiting for hourly scheduled syncs, the system now triggers monitoring data sync **immediately** when these events occur:

- ✅ **Application Submitted** - Student submits application for review
- ✅ **Application Approved** - SSC approves application with funding amount
- ✅ **Application Rejected** - Application is rejected with reason
- ✅ **Funds Released** - Scholarship funds are disbursed to student

### 2. Async Processing

The monitoring sync runs **asynchronously** (non-blocking) using Laravel's queue system:
- Main request completes immediately
- Monitoring sync runs in background
- No performance impact on user operations

### 3. Real-Time Broadcasting

When monitoring sync completes:
1. Data is aggregated from scholarship database
2. Data is sent to monitoring service API
3. Monitoring service updates database (same row for today's date)
4. **WebSocket events are broadcast** to all connected clients
5. Dashboard updates **instantly** without page refresh

## Technical Implementation

### TriggersMonitoringSync Trait

Located at: `app/Traits/TriggersMonitoringSync.php`

```php
use App\Traits\TriggersMonitoringSync;

class ScholarshipApplicationController extends Controller
{
    use TriggersMonitoringSync;
    
    public function approve(Request $request, ScholarshipApplication $application)
    {
        // ... approval logic ...
        
        // Trigger real-time monitoring sync
        $this->triggerMonitoringSync();
        
        return response()->json(['success' => true]);
    }
}
```

### Methods Available

#### `triggerMonitoringSync()` (Async - Recommended)
Queues the monitoring sync command to run in the background. Non-blocking.

```php
$this->triggerMonitoringSync();
```

#### `triggerMonitoringSyncNow()` (Sync - Use Sparingly)
Runs monitoring sync immediately and waits for completion. Blocks the request.

```php
$this->triggerMonitoringSyncNow();
```

## Database Behavior

**Important:** The monitoring service uses `updateOrCreate()` based on `snapshot_date`:

- ✅ **One row per day** - Multiple triggers on the same day update the same row
- ✅ **No duplicate data** - No database bloat from frequent updates
- ✅ **Always current** - Latest data always reflects most recent state

Example:
```php
AnalyticsApplicationDaily::updateOrCreate(
    ['snapshot_date' => '2026-02-07'],  // Find by date
    $data                                 // Update with latest data
);
```

## Scheduled Sync (Backup)

The hourly scheduled sync still runs as a backup:

**File:** `routes/console.php`
```php
Schedule::command('monitoring:sync')->hourly();
```

This ensures data stays fresh even if no events occur.

## Queue Configuration

For async triggers to work, ensure Laravel queue worker is running:

```bash
# Development
php artisan queue:work

# Production (supervisor/systemd)
php artisan queue:work --daemon
```

Or configure queue driver in `.env`:
```env
QUEUE_CONNECTION=database  # or redis, sqs, etc.
```

## Controllers Using This Feature

Currently integrated in:
- ✅ `ScholarshipApplicationController` - submit, approve, reject, release

**Future Integration:**
- `InterviewController` - interview completion, evaluation submission
- `EnrollmentVerificationController` - verification approval
- `DocumentController` - document verification

## Testing Real-Time Updates

1. **Open monitoring dashboard** in browser
2. **Open DevTools console** (F12)
3. **Look for:** `✅ WebSocket connected to monitoring service`
4. **Perform an action:**
   ```bash
   # Submit an application via API
   curl -X POST http://localhost:8001/api/applications/{id}/submit
   ```
5. **Watch dashboard update in real-time** without page refresh!

## Monitoring Logs

Check logs for sync triggers:

```bash
# Scholarship service logs
tail -f storage/logs/laravel.log | grep "Monitoring sync triggered"

# Monitoring service logs
tail -f microservices/monitoring_service/storage/logs/laravel.log | grep "Application snapshot ingested"
```

## Performance Considerations

### Pros
- ✅ True real-time updates
- ✅ Immediate data visibility
- ✅ Better user experience
- ✅ No database bloat (updateOrCreate)

### Cons
- ⚠️ More API calls to monitoring service
- ⚠️ Requires queue worker running
- ⚠️ Slight overhead on each operation

### Optimization Tips

1. **Use async triggers** (`triggerMonitoringSync()`) not sync
2. **Ensure queue worker is running** for background processing
3. **Monitor queue depth** to prevent backlog
4. **Consider rate limiting** if events are extremely frequent

## Troubleshooting

### Sync Not Triggering

**Check queue worker:**
```bash
php artisan queue:work
```

**Check logs:**
```bash
tail -f storage/logs/laravel.log
```

### WebSocket Not Broadcasting

**Check Pusher credentials:**
```bash
# In monitoring_service/.env
BROADCAST_DRIVER=pusher
PUSHER_APP_KEY=your_key
PUSHER_APP_SECRET=your_secret
```

**Check monitoring service logs:**
```bash
tail -f microservices/monitoring_service/storage/logs/laravel.log
```

### Dashboard Not Updating

1. **Check browser console** for WebSocket connection
2. **Verify Pusher credentials** in frontend `.env`
3. **Check network tab** for WebSocket messages
4. **Ensure monitoring service is running**

## Future Enhancements

- [ ] Add sync triggers to interview completion
- [ ] Add sync triggers to document verification
- [ ] Add sync triggers to enrollment verification
- [ ] Implement rate limiting for high-frequency events
- [ ] Add monitoring dashboard for sync health
- [ ] Add retry logic for failed syncs
