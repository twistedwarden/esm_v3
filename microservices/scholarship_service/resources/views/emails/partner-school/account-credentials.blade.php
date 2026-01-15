<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Partner School Account Credentials - GoServePH</title>
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
        .credentials-box {
            background: #fff;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .password-box {
            background: #f0f0f0;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 2px;
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
        <h2>Welcome to GoServePH Partner School Portal</h2>
        
        <p>Hello {{ $name }},</p>
        
        <p>Your partner school account has been created successfully. Please use the credentials below to access the portal:</p>
        
        <div class="credentials-box">
            <p><strong>Login URL:</strong></p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                {{ $loginUrl }}
            </p>
            
            <p style="margin-top: 20px;"><strong>Your Temporary Password:</strong></p>
            <div class="password-box">
                {{ $temporaryPassword }}
            </div>
        </div>
        
        <div class="warning">
            <p style="margin: 0; color: #856404;">
                <strong>⏰ Important:</strong> This is a temporary password. You will be required to change it on your first login.
            </p>
        </div>
        
        <div class="security">
            <p style="margin: 0; color: #721c24;">
                <strong>🔐 Security Notice:</strong> For your security, please change your password immediately after logging in. Do not share your password with anyone.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetLink }}" class="button">Set New Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
            {{ $resetLink }}
        </p>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
            <li>Log in using your email and the temporary password above</li>
            <li>You will be prompted to set a new password</li>
            <li>Once logged in, you can upload verification documents for your school</li>
            <li>Review the partner school guidelines in the portal</li>
        </ol>
        
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
