<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Application Status Update</title>
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
            background-color: #2563EB;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }

        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
            background-color: #6B7280;
            /* Default gray */
            margin: 10px 0;
        }

        .status-submitted {
            background-color: #3B82F6;
        }

        /* Blue */
        .status-reviewed {
            background-color: #8B5CF6;
        }

        /* Purple */
        .status-approved {
            background-color: #10B981;
        }

        /* Green */
        .status-rejected {
            background-color: #EF4444;
        }

        /* Red */
        .status-processing {
            background-color: #F59E0B;
        }

        /* Amber */
        .status-released {
            background-color: #059669;
        }

        /* Emerald */

        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }

        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>GoServePH Scholarship</h1>
    </div>

    <div class="content">
        <p>Dear {{ $student_name }},</p>

        <p>This is to inform you that the status of your scholarship application
            <strong>#{{ $application_number }}</strong> has been updated.
        </p>

        <div style="text-align: center;">
            <p>New Status:</p>
            <span class="status-badge status-{{ strtolower($status) }}">
                {{ strtoupper(str_replace('_', ' ', $status)) }}
            </span>
        </div>

        @if(isset($message) && $message)
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #2563EB; margin: 15px 0;">
                <strong>Note from Admin:</strong><br>
                {{ $message }}
            </div>
        @endif

        <p>
            @if($status === 'submitted')
                Your application has been received and is waiting for review.
            @elseif($status === 'reviewed')
                Your application has been reviewed and is pending to schedule interview.
            @elseif($status === 'approved')
                Congratulations! Your application has been approved.
            @elseif($status === 'rejected')
                We regret to inform you that your application was not successful.
            @elseif($status === 'processing')
                Your grant is currently being processed for disbursement.
            @elseif($status === 'released')
                Your scholarship grant has been released!
            @elseif($status === 'documents_reviewed')
                Your documents have been reviewed and approved. We will be scheduling your interview shortly.
            @elseif($status === 'interview_scheduled')
                    Your interview has been scheduled.

                    @if(isset($data) && !empty($data))
                        <div style="background-color: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: left;">
                            <p style="margin-top: 0;"><strong>Interview Details:</strong></p>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="margin-bottom: 5px;"><strong>Date:</strong>
                                    {{ date('F j, Y', strtotime($data['interview_date'])) }}</li>
                                <li style="margin-bottom: 5px;"><strong>Time:</strong>
                                    {{ date('g:i A', strtotime($data['interview_time'])) }}</li>
                                <li style="margin-bottom: 5px;"><strong>Type:</strong>
                                    {{ ucfirst(str_replace('_', ' ', $data['interview_type'])) }}</li>
                                <li style="margin-bottom: 5px;"><strong>Interviewer:</strong> {{ $data['interviewer_name'] }}</li>
                                @if(!empty($data['meeting_link']))
                                    <li style="margin-top: 10px;">
                                        <strong>Link:</strong> <br>
                                        <a href="{{ $data['meeting_link'] }}" target="_blank"
                                            style="color: #2563EB; word-break: break-all;">{{ $data['meeting_link'] }}</a>
                                    </li>
                                @endif
                            </ul>
                        </div>
                    @else
                    Please check your account for details.
                @endif
            @elseif($status === 'interview_completed')
            Your interview has been completed. Please wait for the final result.
        @elseif($status === 'endorsed_to_ssc')
            Congratulations! Your application has been endorsed to the Scholarship Selection Committee (SSC) for final
            approval.
        @endif
        </p>

        <p>You can view the full details of your application by logging into your account.</p>

        <div style="text-align: center;">
            <a href="http://localhost:5173" class="button">View Application</a>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} GoServePH. All rights reserved.</p>
    </div>
</body>

</html>