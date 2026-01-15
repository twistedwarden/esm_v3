<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset - GoServePH</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .security {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 12px;
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
        <h2>Password Reset Request</h2>
        
        <p>Hello {{ $name }},</p>
        
        <p>You have requested to reset your password for your GoServePH Partner School account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetLink }}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            {{ $resetLink }}
        </p>
        
        <div class="warning">
            <p style="margin: 0; color: #856404;">
                <strong>⏰ This link will expire in 24 hours.</strong>
            </p>
        </div>
        
        <div class="security">
            <p style="margin: 0; color: #721c24;">
                <strong>🔐 Security Notice:</strong> If you did not request a password reset, please ignore this email or contact support immediately if you have concerns about your account security.
            </p>
        </div>
        
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
