<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Status Update - GoServePH</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .notice-box {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GoServePH</h1>
        <p>Partner School Portal</p>
    </div>
    
    <div class="content">
        <h2>Application Status Update</h2>
        
        <p>Hello {{ $name }},</p>
        
        <div class="notice-box">
            <p style="margin: 0; color: #721c24;">
                <strong>⚠️ Application Status:</strong> Your partner school application has been reviewed and unfortunately, it has not been approved at this time.
            </p>
        </div>
        
        @if($message)
        <p><strong>Reason for Rejection:</strong></p>
        <p>{{ $message }}</p>
        @endif
        
        <p><strong>What Can You Do?</strong></p>
        <ul>
            <li>Review the rejection reason provided above</li>
            <li>Address any issues or missing documentation</li>
            <li>You may submit a new application once the issues are resolved</li>
            <li>Contact our support team if you need clarification</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>
        The GoServePH Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© {{ date('Y') }} GoServePH. All rights reserved.</p>
    </div>
</body>
</html>
