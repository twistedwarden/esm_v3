<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock Payment Checkout</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .checkout-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }

        .checkout-header {
            background: #ffffff;
            padding: 24px 24px 20px;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .checkout-header h1 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
        }

        .secure-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #059669;
            font-size: 0.75rem;
            font-weight: 500;
            background: #ecfdf5;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .checkout-body {
            padding: 32px 24px;
        }

        .amount-section {
            margin-bottom: 32px;
        }

        .amount-label {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 4px;
        }

        .amount-value {
            font-size: 2.25rem;
            font-weight: 700;
            color: #111827;
        }

        .payment-methods {
            margin-bottom: 32px;
        }

        .section-title {
            color: #374151;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .method-option {
            display: flex;
            align-items: center;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }

        .method-option:hover {
            border-color: #d1d5db;
            background: #f9fafb;
        }

        .method-option.selected {
            border-color: #2563eb;
            background: #eff6ff;
            box-shadow: 0 0 0 1px #2563eb;
        }

        .method-option input {
            position: absolute;
            opacity: 0;
        }

        .radio-custom {
            width: 18px;
            height: 18px;
            border: 2px solid #d1d5db;
            border-radius: 50%;
            margin-right: 12px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .method-option.selected .radio-custom {
            border-color: #2563eb;
        }

        .method-option.selected .radio-custom::after {
            content: '';
            width: 8px;
            height: 8px;
            background: #2563eb;
            border-radius: 50%;
        }

        .method-icon {
            margin-right: 12px;
            font-size: 1.25rem;
            width: 24px;
            text-align: center;
        }

        .method-name {
            font-weight: 500;
            color: #1f2937;
            font-size: 0.95rem;
        }

        .pay-button {
            width: 100%;
            padding: 14px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .pay-button:hover {
            background: #1d4ed8;
        }

        .footer-note {
            text-align: center;
            padding: 24px;
            border-top: 1px solid #f3f4f6;
            color: #9ca3af;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 40px 20px;
        }

        .loading.show {
            display: block;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #2563eb;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }
    </style>
</head>

<body>
    <div class="checkout-container">
        <div class="checkout-header">
            <h1>Complete Payment</h1>
            <div class="secure-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Secure Checkout
            </div>
        </div>

        <div class="checkout-body" id="paymentForm">
            <div class="amount-section">
                <div class="amount-label">Amount Due</div>
                <div class="amount-value">₱{{ number_format($amount, 2) }}</div>
            </div>

            <div class="payment-methods">
                <div class="section-title">Payment Method</div>

                @php
                    $preferred = request('method', 'gcash'); // Default to GCash if not specified
                @endphp

                <label class="method-option {{ $preferred == 'gcash' ? 'selected' : '' }}">
                    <input type="radio" name="method" value="gcash" {{ $preferred == 'gcash' ? 'checked' : '' }}>
                    <div class="radio-custom"></div>
                    <span class="method-icon">G</span>
                    <span class="method-name">GCash</span>
                </label>

                <label class="method-option {{ $preferred == 'maya' || $preferred == 'paymaya' ? 'selected' : '' }}">
                    <input type="radio" name="method" value="maya" {{ $preferred == 'maya' || $preferred == 'paymaya' ? 'checked' : '' }}>
                    <div class="radio-custom"></div>
                    <span class="method-icon">M</span>
                    <span class="method-name">Maya</span>
                </label>

                <label class="method-option {{ $preferred == 'card' ? 'selected' : '' }}">
                    <input type="radio" name="method" value="card" {{ $preferred == 'card' ? 'checked' : '' }}>
                    <div class="radio-custom"></div>
                    <span class="method-icon">💳</span>
                    <span class="method-name">Credit/Debit Card</span>
                </label>

                <label class="method-option {{ $preferred == 'bank_transfer' ? 'selected' : '' }}">
                    <input type="radio" name="method" value="bank_transfer" {{ $preferred == 'bank_transfer' ? 'checked' : '' }}>
                    <div class="radio-custom"></div>
                    <span class="method-icon">🏦</span>
                    <span class="method-name">Bank Transfer</span>
                </label>
            </div>

            <form action="{{ route('payment.mock-complete', ['id' => $paymentId]) }}" method="POST">
                @csrf
                <input type="hidden" name="application_id" value="{{ $applicationId }}">
                <button type="submit" class="pay-button" id="payBtn">
                    Pay ₱{{ number_format($amount, 2) }}
                </button>
            </form>
        </div>

        <div class="loading" id="loadingState">
            <div class="spinner"></div>
            <p style="color: #4b5563; font-weight: 500;">Processing secure payment...</p>
            <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 8px;">Please do not close this window</p>
        </div>

        <div class="footer-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Encrypted and secured by PayMongo
        </div>
    </div>

    <script>
        // Handle method selection styling
        document.querySelectorAll('.method-option').forEach(option => {
            option.addEventListener('click', function () {
                document.querySelectorAll('.method-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
            });
        });

        // Handle form submission
        document.querySelector('form').addEventListener('submit', function () {
            document.getElementById('paymentForm').style.display = 'none';
            document.getElementById('loadingState').classList.add('show');
        });
    </script>
</body>

</html>