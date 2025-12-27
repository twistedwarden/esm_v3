# Document Security Setup Guide

This guide explains how to set up comprehensive document security scanning for the GSM Scholarship Management System.

## Overview

The system now includes multi-layer document security:
- **Client-side validation**: File type, size, and signature verification
- **Server-side virus scanning**: ClamAV integration for malware detection
- **Async processing**: Background scanning for performance
- **Quarantine system**: Automatic isolation of infected files
- **Admin monitoring**: Real-time security dashboard

## Prerequisites

- PHP 8.1+ with Laravel
- Node.js 16+ for frontend
- Database (MySQL/PostgreSQL)
- ClamAV antivirus engine

## Installation Steps

### 1. Database Setup

Run the migrations to create security tables:

```bash
cd microservices/scholarship_service
php artisan migrate
```

This creates:
- `virus_scan_logs` - Scan history and results
- `document_quarantine` - Quarantined files tracking
- Updates `documents` table with `virus_scan_log_id`

### 2. ClamAV Installation

#### Windows Setup

1. **Download ClamAV**:
   - Go to https://www.clamav.net/downloads
   - Download the latest Windows installer
   - Install to `C:\ClamAV\`

2. **Configure ClamAV**:
   ```cmd
   # Update virus definitions
   C:\ClamAV\bin\freshclam.exe
   
   # Start ClamAV daemon
   C:\ClamAV\bin\clamd.exe --config-file=C:\ClamAV\conf\clamd.conf
   ```

3. **Test Installation**:
   ```cmd
   C:\ClamAV\bin\clamscan.exe --version
   ```

#### Linux Setup (Ubuntu/Debian)

1. **Install ClamAV**:
   ```bash
   sudo apt-get update
   sudo apt-get install clamav clamav-daemon
   ```

2. **Update Virus Definitions**:
   ```bash
   sudo freshclam
   ```

3. **Start and Enable Service**:
   ```bash
   sudo systemctl enable clamav-daemon
   sudo systemctl start clamav-daemon
   sudo systemctl status clamav-daemon
   ```

#### Linux Setup (CentOS/RHEL)

1. **Install ClamAV**:
   ```bash
   sudo yum install epel-release
   sudo yum install clamav clamd
   ```

2. **Update Virus Definitions**:
   ```bash
   sudo freshclam
   ```

3. **Start and Enable Service**:
   ```bash
   sudo systemctl enable clamd
   sudo systemctl start clamd
   ```

### 3. Laravel Configuration

Update your `.env` file in `microservices/scholarship_service/`:

```env
# Virus Scanner Configuration
VIRUS_SCANNER_TYPE=clamd
CLAMD_ENABLED=true
CLAMD_HOST=localhost
CLAMD_PORT=3310
CLAMSCAN_PATH=/usr/bin/clamscan  # Linux: /usr/bin/clamscan, Windows: C:\ClamAV\bin\clamscan.exe

# Scan Behavior
VIRUS_SCAN_TIMEOUT=30
VIRUS_SCAN_MAX_RETRIES=3
VIRUS_SCAN_FALLBACK_POLICY=reject

# Logging
VIRUS_LOG_SCANS=true
VIRUS_LOG_LEVEL=info
```

### 4. Queue Worker Setup

For async scanning, set up Laravel queue workers:

```bash
# Install Redis (recommended for production)
sudo apt-get install redis-server

# Or use database queue (simpler setup)
# Update QUEUE_CONNECTION=database in .env

# Run queue worker
php artisan queue:work --daemon
```

### 5. Frontend Dependencies

The frontend components are already included. No additional installation needed.

## Testing the Setup

### 1. Test Clean File Upload

1. Upload a regular PDF or image file
2. Check that it processes normally
3. Verify scan log entry in database

### 2. Test with EICAR Test File

1. Create a text file with this content:
   ```
   X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
   ```
2. Save as `eicar.txt`
3. Try to upload it
4. Should be rejected with security message

### 3. Check Admin Dashboard

1. Navigate to Admin → Security Dashboard
2. Verify statistics are showing
3. Check scan logs are being recorded

## Configuration Options

### Scanner Types

```env
# ClamAV Daemon (recommended)
VIRUS_SCANNER_TYPE=clamd

# ClamAV CLI (slower, for testing)
VIRUS_SCANNER_TYPE=clamscan

# VirusTotal API (cloud-based)
VIRUS_SCANNER_TYPE=virustotal
VIRUSTOTAL_API_KEY=your_api_key_here

# Windows Defender (Windows only)
VIRUS_SCANNER_TYPE=defender
WINDOWS_DEFENDER_PATH=C:\Program Files\Windows Defender\MpCmdRun.exe

# Disable scanning (not recommended)
VIRUS_SCANNER_TYPE=disabled
```

### Performance Tuning

```env
# Reduce scan timeout for faster uploads
VIRUS_SCAN_TIMEOUT=15

# Increase retries for reliability
VIRUS_SCAN_MAX_RETRIES=5

# Allow files if scanner fails (not recommended for security)
VIRUS_SCAN_FALLBACK_POLICY=allow
```

## Monitoring and Maintenance

### 1. Regular Maintenance

```bash
# Update virus definitions daily
sudo freshclam

# Check scanner health
php artisan tinker
>>> app(\App\Services\VirusScannerService::class)->getHealthStatus()

# Clean old scan logs (optional)
php artisan schedule:run
```

### 2. Monitoring Commands

```bash
# Check recent scans
php artisan tinker
>>> \App\Models\VirusScanLog::latest()->take(10)->get()

# Check quarantine
>>> \DB::table('document_quarantine')->latest()->take(5)->get()

# Scanner statistics
>>> app(\App\Http\Controllers\VirusScanController::class)->statistics(new \Illuminate\Http\Request())
```

### 3. Log Monitoring

```bash
# Monitor scan activity
tail -f storage/logs/laravel.log | grep -i "virus"

# Count infected files
grep -c "virus detected" storage/logs/laravel.log

# Check quarantine activity
grep -i "quarantine" storage/logs/laravel.log
```

## Troubleshooting

### Common Issues

#### 1. ClamAV Not Starting

**Error**: `clamd: ERROR: Can't bind to 127.0.0.1:3310`

**Solution**:
```bash
# Check if port is in use
sudo netstat -tlnp | grep 3310

# Kill existing process
sudo pkill clamd

# Start fresh
sudo systemctl start clamav-daemon
```

#### 2. Permission Denied

**Error**: `Permission denied` when scanning files

**Solution**:
```bash
# Fix ClamAV permissions
sudo chown -R clamav:clamav /var/lib/clamav/
sudo chmod -R 755 /var/lib/clamav/

# Fix Laravel storage permissions
sudo chown -R www-data:www-data storage/
sudo chmod -R 775 storage/
```

#### 3. Slow Scan Performance

**Solutions**:
- Use ClamAV daemon instead of CLI
- Reduce scan timeout
- Enable async scanning
- Upgrade server resources

#### 4. False Positives

**Solutions**:
- Update virus definitions: `sudo freshclam`
- Whitelist specific file types
- Adjust VirusTotal thresholds
- Review quarantine logs

### Debug Mode

Enable detailed logging:

```env
VIRUS_LOG_LEVEL=debug
LOG_LEVEL=debug
```

Check logs:
```bash
tail -f storage/logs/laravel.log | grep -i "virus\|clam"
```

## Security Considerations

### 1. File Upload Limits

```env
# Maximum file size (10MB)
UPLOAD_MAX_FILESIZE=10M

# Allowed file types
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png
```

### 2. Quarantine Security

- Quarantined files are stored in `storage/app/public/quarantine/`
- Files are renamed with document ID prefix
- Access is restricted to admin users only
- Regular cleanup of old quarantined files recommended

### 3. Log Security

- Scan logs contain file names and threat information
- Regular log rotation recommended
- Consider encrypting sensitive log data

## API Endpoints

### Document Security

- `GET /api/documents/{id}/scan-status` - Get scan status
- `GET /api/virus-scan/statistics` - Get scan statistics
- `GET /api/virus-scan/logs` - Get scan logs
- `GET /api/virus-scan/quarantine` - Get quarantined files

### Admin Actions

- `POST /api/virus-scan/quarantine/{id}/review` - Review quarantined file
- `DELETE /api/virus-scan/quarantine/{id}` - Delete quarantined file

## Performance Metrics

### Expected Performance

- **Client-side validation**: 50-100ms
- **Server-side scan**: 100-500ms
- **Async processing**: 1-5 seconds
- **ClamAV daemon**: ~5x faster than CLI

### Monitoring

- Track scan success/failure rates
- Monitor average scan times
- Watch for scanner health issues
- Review quarantine statistics

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check ClamAV logs: `/var/log/clamav/` (Linux)
4. Verify configuration in `.env`
5. Test with EICAR file

## Updates

To update the security system:

1. Pull latest code changes
2. Run migrations: `php artisan migrate`
3. Update ClamAV: `sudo freshclam`
4. Restart services: `sudo systemctl restart clamav-daemon`
5. Clear caches: `php artisan cache:clear`

---

**Security Level**: ⭐⭐⭐⭐⭐ Maximum Protection Enabled

Your document upload system now provides enterprise-grade security with comprehensive virus scanning, threat detection, and automated quarantine capabilities.
