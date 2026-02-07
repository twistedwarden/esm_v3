<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Payment</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #0f172a;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .bg-pattern {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            z-index: -1;
        }

        .checkout-wrapper {
            width: 100%;
            max-width: 400px;
            /* Smaller width */
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            position: relative;
        }

        .header {
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 1rem;
            color: #0f172a;
        }

        .brand-icon {
            width: 28px;
            height: 28px;
            background: #4f46e5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .main-content {
            padding: 24px;
        }

        .amount-display {
            text-align: center;
            margin-bottom: 24px;
        }

        .amount-label {
            font-size: 0.8rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .amount-value {
            font-size: 2rem;
            font-weight: 700;
            color: #0f172a;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            color: #334155;
            margin-bottom: 8px;
        }

        .custom-select {
            width: 100%;
            padding: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #1e293b;
            background-color: #f8fafc;
            outline: none;
            transition: all 0.2s;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 16px;
        }

        .custom-select:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
        }

        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .submit-btn {
            width: 100%;
            padding: 14px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .submit-btn:hover {
            background: #4338ca;
        }

        .cancel-btn {
            width: 100%;
            padding: 10px;
            background: transparent;
            color: #64748b;
            border: none;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: color 0.2s;
        }

        .cancel-btn:hover {
            color: #1e293b;
        }

        .footer {
            padding: 16px;
            text-align: center;
            font-size: 0.7rem;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
        }

        /* Loading State */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        .loading-overlay.active {
            opacity: 1;
            pointer-events: all;
        }

        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 12px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    </style>
</head>

<body>
    <div class="bg-pattern"></div>

    <div class="checkout-wrapper">
        <!-- Header -->
        <div class="header">
            <div class="brand">
                <div class="brand-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                EduAid Secure
            </div>
            <div style="font-size: 0.75rem; color: #64748b; font-family: monospace;">
                APP-{{ request('application_id') ?? 'N/A' }}
            </div>
        </div>

        <!-- Main Body -->
        <div class="main-content">

            <div class="amount-display">
                <div class="amount-label">Total Amount</div>
                <div class="amount-value">₱{{ number_format($amount, 2) }}</div>
            </div>

            <form action="{{ route('payment.mock-complete', ['id' => $paymentId]) }}" method="POST" id="paymentForm">
                @csrf
                <input type="hidden" name="application_id" value="{{ $applicationId }}">

                @php $preferred = request('method', 'gcash'); @endphp

                <div class="form-group">
                    <label class="form-label">Payment Method</label>
                    <select name="method" class="custom-select">
                        <option value="gcash" {{ $preferred == 'gcash' ? 'selected' : '' }}>GCash</option>
                        <option value="maya" {{ $preferred == 'maya' || $preferred == 'paymaya' ? 'selected' : '' }}>Maya
                        </option>
                        <option value="card" {{ $preferred == 'card' ? 'selected' : '' }}>Credit / Debit Card</option>
                        <option value="bank_transfer" {{ $preferred == 'bank_transfer' ? 'selected' : '' }}>Bank Transfer
                        </option>
                    </select>
                </div>

                <div class="btn-group">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Pay ₱{{ number_format($amount, 2) }}
                    </button>

                    <a href="{{ $frontendUrl }}/admin/school-aid/applications" class="cancel-btn">
                        Cancel & Return
                    </a>
                </div>
            </form>
        </div>

        <!-- Footer -->
        <div class="footer">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                style="margin-right: 4px; vertical-align: middle;">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secured by PayMongo • 256-bit SSL
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner"></div>
            <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Processing</h4>
            <p style="color: #64748b; font-size: 0.8rem;">Please wait...</p>
        </div>
    </div>

    <script>
        document.getElementById('paymentForm').addEventListener('submit', function() {
            document.getElementById('loadingOverlay').classList.add('active');
            
            // Disable button
            const btn = document.getElementById('submitBtn');
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
        });
    </script>
</body>

</html>