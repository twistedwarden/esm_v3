<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Scholarship Analytics Report</title>
    <style>
        body {
            font-family: sans-serif;
            color: #333;
            line-height: 1.6;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }

        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }

        .meta-info {
            text-align: right;
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 20px;
        }

        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .section-title {
            background-color: #f8f9fa;
            border-left: 5px solid #4CAF50;
            padding: 10px;
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
        }

        .metrics-grid {
            width: 100%;
            margin-bottom: 20px;
        }

        .metric-card {
            display: inline-block;
            width: 23%;
            background-color: #fff;
            border: 1px solid #e0e0e0;
            padding: 10px;
            text-align: center;
            margin-right: 1%;
            vertical-align: top;
        }

        .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            display: block;
        }

        .metric-label {
            font-size: 12px;
            color: #7f8c8d;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 15px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
            color: #2c3e50;
        }

        tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .bar-chart-container {
            margin-top: 10px;
        }

        .bar-row {
            margin-bottom: 5px;
            display: table;
            width: 100%;
        }

        .bar-label {
            display: table-cell;
            width: 30%;
            font-size: 11px;
            vertical-align: middle;
        }

        .bar-area {
            display: table-cell;
            width: 70%;
            vertical-align: middle;
        }

        .bar {
            height: 15px;
            background-color: #3498db;
            display: inline-block;
        }

        .bar-value {
            display: inline-block;
            font-size: 10px;
            margin-left: 5px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 10px;
            text-align: center;
            color: #95a5a6;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Scholarship Analytics Report</h1>
        <p style="margin: 5px 0; font-size: 14px;">Education & Scholarship Management System</p>
    </div>

    <div class="meta-info">
        <p>Generated on: {{ date('F d, Y h:i A') }}</p>
        <p>Period: {{ ucfirst($timeRange) }}</p>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="metrics-grid">
            <div class="metric-card">
                <span class="metric-value">{{ number_format($analytics['summary']['totalApplications']) }}</span>
                <span class="metric-label">Total Applications</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">{{ $analytics['summary']['approvalRate'] }}%</span>
                <span class="metric-label">Approval Rate</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">{{ $analytics['summary']['avgProcessingTime'] }} days</span>
                <span class="metric-label">Avg Processing Time</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">₱{{ number_format($analytics['summary']['totalAidDistributed']) }}</span>
                <span class="metric-label">Total Aid Distributed</span>
            </div>
        </div>
    </div>

    <!-- Failure Analysis -->
    <div class="section">
        <div class="section-title">Rejection Analysis</div>
        <table>
            <thead>
                <tr>
                    <th>Reason</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @foreach($analytics['failureReasons'] as $reason)
                    <tr>
                        <td>{{ $reason['reason'] }}</td>
                        <td>{{ $reason['count'] }}</td>
                        <td>{{ $reason['percentage'] }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Financial Distribution -->
    <div class="section">
        <div class="section-title">Financial Profile Distribution</div>
        <table>
            <thead>
                <tr>
                    <th>Income Range</th>
                    <th>Approved</th>
                    <th>Rejected</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($analytics['financialDistribution'] as $dist)
                    <tr>
                        <td>{{ $dist['range'] }}</td>
                        <td>{{ $dist['approved'] }}</td>
                        <td>{{ $dist['rejected'] }}</td>
                        <td>{{ $dist['total'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Family Background -->
    <div class="section">
        <div class="section-title">Family Background Impact</div>
        <table>
            <thead>
                <tr>
                    <th>Family Status</th>
                    <th>Applications</th>
                    <th>Approval Impact</th>
                </tr>
            </thead>
            <tbody>
                @foreach($analytics['familyBackgroundImpact'] as $bg)
                    <tr>
                        <td>{{ $bg['factor'] }}</td>
                        <td>{{ $bg['applications'] }}</td>
                        <td>{{ $bg['impact'] }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Geographic Distribution -->
    <div class="section">
        <div class="section-title">Geographic Distribution (Top 10)</div>
        <table>
            <thead>
                <tr>
                    <th>Location</th>
                    <th>Applications</th>
                    <th>Approval Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach($analytics['geographicDistribution'] as $geo)
                    <tr>
                        <td>{{ $geo['location'] }}</td>
                        <td>{{ $geo['count'] }}</td>
                        <td>{{ $geo['approvalRate'] }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Confidential Report - Generated by ESMS Analytics Module
    </div>
</body>

</html>