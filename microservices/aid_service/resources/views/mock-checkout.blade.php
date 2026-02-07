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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .checkout-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 450px;
            width: 100%;
            overflow: hidden;
        }

        .checkout-header {
            background: #1a1a2e;
            color: white;
            padding: 24px;
            text-align: center;
        }

        .checkout-header h1 {
            font-size: 1.5rem;
            margin-bottom: 8px;
        }

        .checkout-header .demo-badge {
            background: #f59e0b;
            color: #1a1a2e;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-block;
        }

        .checkout-body {
            padding: 32px 24px;
        }

        .amount-display {
            text-align: center;
            margin-bottom: 32px;
        }

        .amount-display .label {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 4px;
        }

        .amount-display .amount {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1a1a2e;
        }

        .payment-methods {
            margin-bottom: 24px;
        }

        .payment-methods h3 {
            color: #374151;
            font-size: 0.875rem;
            margin-bottom: 12px;
        }

        .method-option {
            display: flex;
            align-items: center;
            padding: 16px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .method-option:hover {
            border-color: #667eea;
            background: #f8fafc;
        }

        .method-option.selected {
            border-color: #667eea;
            background: #eef2ff;
        }

        .method-option input {
            margin-right: 12px;
        }

        .method-option .method-name {
            font-weight: 500;
            color: #1f2937;
        }

        .pay-button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .pay-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .pay-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .footer-note {
            text-align: center;
            padding: 16px 24px 24px;
            color: #9ca3af;
            font-size: 0.75rem;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .loading.show {
            display: block;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
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
            <h1>Scholarship Grant Payment</h1>
            <span class="demo-badge">🔧 DEMO MODE</span>
        </div>

        <div class="checkout-body" id="paymentForm">
            <div class="amount-display">
                <div class="label">Total Amount</div>
                <div class="amount">₱{{ number_format($amount, 2) }}</div>
            </div>

            <div class="payment-methods">
                <h3>Select Payment Method</h3>
                <label class="method-option selected">
                    <input type="radio" name="method" value="gcash" checked>
                    <span class="method-name">💚 GCash</span>
                </label>
                <label class="method-option">
                    <input type="radio" name="method" value="maya">
                    <span class="method-name">💜 Maya (PayMaya)</span>
                </label>
                <label class="method-option">
                    <input type="radio" name="method" value="card">
                    <span class="method-name">💳 Credit/Debit Card</span>
                </label>
            </div>

            <form action="{{ route('payment.mock-complete', ['id' => $paymentId]) }}" method="POST">
                @csrf
                <input type="hidden" name="application_id" value="{{ $applicationId }}">
                <button type="submit" class="pay-button" id="payBtn">
                    Simulate Payment ✓
                </button>
            </form>
        </div>

        <div class="loading" id="loadingState">
            <div class="spinner"></div>
            <p>Processing payment...</p>
        </div>

        <div class="footer-note">
            This is a mock checkout for demonstration purposes.<br>
            No actual payment will be processed.
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