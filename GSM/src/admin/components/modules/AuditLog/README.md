# Audit Log System

A comprehensive audit logging system for tracking all user actions and system events in the admin panel.

## Features

### 📊 **Dashboard Overview**
- **Statistics Cards**: Total logs, success rate, failed actions, active users
- **Real-time Data**: Live statistics and recent activity
- **Visual Indicators**: Color-coded status and action badges

### 🔍 **Advanced Filtering**
- **Search**: Full-text search across descriptions, users, and resources
- **Action Filter**: Filter by specific actions (CREATE, UPDATE, DELETE, etc.)
- **User Role Filter**: Filter by user roles (admin, staff, citizen, ps_rep)
- **Resource Type Filter**: Filter by resource types (User, Application, etc.)
- **Status Filter**: Filter by success, failed, or error status
- **Date Range**: Filter by specific date ranges

### 📋 **Comprehensive Logging**
- **User Actions**: All CRUD operations on users
- **System Events**: Login, logout, exports, imports
- **Resource Tracking**: Track changes to specific resources
- **Error Logging**: Failed operations and error messages
- **Metadata**: Additional context and system information

### 📤 **Export & Analysis**
- **JSON Export**: Export filtered logs for analysis
- **Detailed Views**: Expandable log details with full context
- **Pagination**: Efficient handling of large log datasets
- **Real-time Updates**: Refresh data without page reload

## API Endpoints

### Core Endpoints
- `GET /api/audit-logs` - Get paginated audit logs with filtering
- `GET /api/audit-logs/statistics` - Get audit log statistics
- `GET /api/audit-logs/recent` - Get recent audit logs
- `GET /api/audit-logs/filter-options` - Get available filter options
- `GET /api/audit-logs/export` - Export audit logs
- `GET /api/audit-logs/{id}` - Get specific audit log details

### User-Specific Endpoints
- `GET /api/audit-logs/user/{userId}` - Get logs for specific user
- `GET /api/audit-logs/resource/{type}/{id}` - Get logs for specific resource

## Database Schema

### AuditLog Model
```php
- id: Primary key
- user_id: ID of user who performed action
- user_email: Email of user (for easier querying)
- user_role: Role of user at time of action
- action: Action performed (CREATE, UPDATE, DELETE, etc.)
- resource_type: Type of resource affected
- resource_id: ID of affected resource
- description: Human-readable description
- old_values: Previous values (for updates)
- new_values: New values (for creates/updates)
- ip_address: IP address of user
- user_agent: Browser/client information
- session_id: Session identifier
- status: success, failed, error
- error_message: Error details if failed
- metadata: Additional context data
- created_at: Timestamp
- updated_at: Timestamp
```

## Usage Examples

### Logging User Creation
```php
AuditLogService::logUserCreation([
    'id' => 123,
    'email' => 'user@example.com',
    'role' => 'staff'
]);
```

### Logging User Update
```php
AuditLogService::logUserUpdate($oldData, $newData);
```

### Logging System Events
```php
AuditLogService::logSystemEvent('maintenance', 'System maintenance completed');
```

### Logging Failed Actions
```php
AuditLogService::logFailedAction(
    'CREATE',
    'Failed to create user',
    'Email already exists',
    'User',
    '123'
);
```

## Security Features

### Data Protection
- **Sensitive Data Redaction**: Passwords and tokens are automatically redacted
- **IP Tracking**: All actions are tracked with IP addresses
- **Session Tracking**: Actions are linked to user sessions
- **User Context**: Full user context is preserved for each action

### Access Control
- **Admin Only**: Audit logs are only accessible to admin users
- **Authentication Required**: All endpoints require valid authentication
- **Role-Based Access**: Access is controlled by user roles

## Monitoring & Alerts

### Real-time Monitoring
- **Success Rate Tracking**: Monitor system health through success rates
- **Error Detection**: Identify and track failed operations
- **User Activity**: Monitor user behavior and activity patterns
- **Resource Usage**: Track resource access and modifications

### Performance Considerations
- **Indexed Queries**: Database is optimized with proper indexes
- **Pagination**: Large datasets are handled efficiently
- **Caching**: Frequently accessed data is cached
- **Background Processing**: Heavy operations are processed asynchronously

## Setup Instructions

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Seed Sample Data**:
   ```bash
   php artisan db:seed --class=AuditLogSeeder
   ```

3. **Test API**:
   ```bash
   curl http://localhost:8000/api/audit-logs/recent
   ```

## Frontend Integration

The AuditLog component is fully integrated into the admin panel:

1. **Sidebar Navigation**: Accessible via "Audit Logs" menu item
2. **Responsive Design**: Works on all screen sizes
3. **Dark Mode Support**: Full dark/light theme support
4. **Real-time Updates**: Data refreshes automatically
5. **Export Functionality**: One-click data export

## Troubleshooting

### Common Issues

1. **No Logs Showing**: Check if migration was run and seeder was executed
2. **API Errors**: Verify scholarship service is running on port 8000
3. **Permission Errors**: Ensure user has admin role
4. **Export Issues**: Check browser download permissions

### Debug Mode

Enable debug logging in the AuditLogService to troubleshoot issues:
```php
// In AuditLogService.php
Log::info('Audit log created', $logData);
```

## Future Enhancements

- **Real-time Notifications**: WebSocket-based real-time updates
- **Advanced Analytics**: Machine learning-based anomaly detection
- **Automated Alerts**: Email/SMS notifications for critical events
- **Data Retention**: Automated cleanup of old logs
- **Compliance Reporting**: Generate compliance reports for audits
