<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Approved - GoServePH</title>
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
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
        .success-box {
            background: #d4edda;
            border-left: 4px solid #28a745;
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
        <h2>Application Approved! 🎉</h2>
        
        <p>Hello {{ $name }},</p>
        
        <div class="success-box">
            <p style="margin: 0; color: #155724;">
                <strong>✅ Congratulations!</strong> Your partner school application has been approved.
            </p>
        </div>
        
        <p>Your school is now a verified partner school in the GoServePH system.</p>
        
        @if($message)
        <p><strong>Additional Information:</strong></p>
        <p>{{ $message }}</p>
        @endif
        
        <p><strong>What's Next?</strong></p>
        <ul>
            <li>Your school is now active in the partner school portal</li>
            <li>You can access all partner school features and services</li>
            <li>Your verification status is valid for one year</li>
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
