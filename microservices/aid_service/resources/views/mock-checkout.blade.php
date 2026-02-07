<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Payment</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0f172a; /* Darker Slate Background */
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
            opacity: 1; /* Fully opaque dark background */
            z-index: -1;
        }

        .checkout-wrapper {
            width: 100%;
            max-width: 480px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); /* Stronger shadow for dark bg */
            overflow: hidden;
            position: relative;
        }

        .header {
            padding: 24px 32px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
        }

        /* ... (rest of styles remain same until buttons) ... */

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.1rem;
            color: #0f172a;
        }

        .brand-icon {
            width: 32px;
            height: 32px;
            background: #4f46e5;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .secure-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            color: #059669;
            background: #ecfdf5;
            padding: 6px 10px;
            border-radius: 99px;
            border: 1px solid #d1fae5;
        }

        .main-content {
            padding: 32px;
        }

        .order-summary {
            margin-bottom: 32px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #eff6ff;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9rem;
            color: #64748b;
        }

        .summary-row.total {
            margin-top: 16px;
            margin-bottom: 0;
            padding-top: 16px;
            border-top: 1px dashed #cbd5e1;
            font-weight: 700;
            font-size: 1.25rem;
            color: #0f172a;
        }

        .section-label {
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #94a3b8;
            margin-bottom: 16px;
        }

        .payment-options {
            display: grid;
            gap: 12px;
        }

        .option-label {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .option-label:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
        }

        .option-label.selected {
            border-color: #4f46e5;
            background: #eef2ff;
            box-shadow: 0 0 0 1px #4f46e5;
        }

        .option-radio {
            position: absolute;
            opacity: 0;
        }

        .radio-custom {
            width: 20px;
            height: 20px;
            border: 2px solid #cbd5e1;
            border-radius: 50%;
            margin-right: 16px;
            display: grid;
            place-items: center;
            transition: all 0.2s;
        }

        .option-label.selected .radio-custom {
            border-color: #4f46e5;
        }

        .radio-custom::after {
            content: '';
            width: 10px;
            height: 10px;
            background: #4f46e5;
            border-radius: 50%;
            transform: scale(0);
            transition: transform 0.2s;
        }

        .option-label.selected .radio-custom::after {
            transform: scale(1);
        }

        .method-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .method-icon {
            font-size: 1.25rem;
            width: 24px;
            text-align: center;
        }

        .method-name {
            font-weight: 600;
            font-size: 0.95rem;
        }

        .btn-group {
            margin-top: 32px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .submit-btn {
            width: 100%;
            padding: 18px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .submit-btn:hover {
            background: #4338ca;
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        }

        .cancel-btn {
            width: 100%;
            padding: 14px;
            background: transparent;
            color: #64748b;
            border: none;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: color 0.2s;
        }

        .cancel-btn:hover {
            color: #1e293b;
            text-decoration: underline;
        }

        .footer {
            padding: 20px;
            text-align: center;
            font-size: 0.75rem;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: center;
            gap: 16px;
        }

        /* Loading State */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
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
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

    </style>
</head>
<body>
    <div class="bg-pattern"></div>

    <div class="checkout-wrapper">
        <!-- Header -->
        <div class="header">
            <div class="brand">
                <div class="brand-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                EduAid
            </div>
            <div class="secure-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure
            </div>
        </div>

        <!-- Main Body -->
        <div class="main-content">
            
            <!-- Order Summary -->
            <div class="order-summary">
                <div class="summary-row">
                    <span>Reference</span>
                    <span style="font-family: monospace;">APP-{{ request('application_id') ?? 'N/A' }}</span>
                </div>
                <div class="summary-row">
                    <span>Description</span>
                    <span>Scholarship Grant</span>
                </div>
                <div class="summary-row total">
                    <span>Total Due</span>
                    <span>₱{{ number_format($amount, 2) }}</span>
                </div>
            </div>

            <!-- Payment Methods -->
            <div class="section-label">Select Payment Method</div>
            
            <form action="{{ route('payment.mock-complete', ['id' => $paymentId]) }}" method="POST" id="paymentForm">
                @csrf
                <input type="hidden" name="application_id" value="{{ $applicationId }}">
                
                @php $preferred = request('method', 'gcash'); @endphp

                <div class="payment-options">
                    <!-- GCash -->
                    <label class="option-label {{ $preferred == 'gcash' ? 'selected' : '' }}" onclick="selectMethod(this)">
                        <input type="radio" name="method" value="gcash" class="option-radio" {{ $preferred == 'gcash' ? 'checked' : '' }}>
                        <div class="radio-custom"></div>
                        <div class="method-info">
                            <span class="method-icon" style="color: #007DFE;">G</span>
                            <span class="method-name">GCash</span>
                        </div>
                    </label>

                    <!-- Maya -->
                    <label class="option-label {{ $preferred == 'maya' || $preferred == 'paymaya' ? 'selected' : '' }}" onclick="selectMethod(this)">
                        <input type="radio" name="method" value="maya" class="option-radio" {{ $preferred == 'maya' || $preferred == 'paymaya' ? 'checked' : '' }}>
                        <div class="radio-custom"></div>
                        <div class="method-info">
                            <span class="method-icon" style="color: #6f21ef;">M</span>
                            <span class="method-name">Maya</span>
                        </div>
                    </label>

                    <!-- Card -->
                    <label class="option-label {{ $preferred == 'card' ? 'selected' : '' }}" onclick="selectMethod(this)">
                        <input type="radio" name="method" value="card" class="option-radio" {{ $preferred == 'card' ? 'checked' : '' }}>
                        <div class="radio-custom"></div>
                        <div class="method-info">
                            <span class="method-icon">💳</span>
                            <span class="method-name">Credit / Debit Card</span>
                        </div>
                    </label>

                    <!-- Bank Transfer -->
                    <label class="option-label {{ $preferred == 'bank_transfer' ? 'selected' : '' }}" onclick="selectMethod(this)">
                        <input type="radio" name="method" value="bank_transfer" class="option-radio" {{ $preferred == 'bank_transfer' ? 'checked' : '' }}>
                        <div class="radio-custom"></div>
                        <div class="method-info">
                            <span class="method-icon">🏦</span>
                            <span class="method-name">Bank Transfer</span>
                        </div>
                    </label>
                </div>

                <div class="btn-group">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Pay ₱{{ number_format($amount, 2) }}
                    </button>
                    
                    <a href="{{ $frontendUrl }}/admin/school-aid/applications" class="cancel-btn">
                        Cancel Payment
                    </a>
                </div>
            </form>
        </div>

        <!-- Footer -->
        <div class="footer">
            <span>Powered by PayMongo</span>
            <span>•</span>
            <span>Terms & Privacy</span>
            <span>•</span>
            <span style="display: flex; align-items: center; gap: 4px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 256-bit SSL
            </span>
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner"></div>
            <h3 style="font-weight: 600; color: #1e293b;">Processing Payment...</h3>
            <p style="color: #64748b; font-size: 0.9rem; margin-top: 8px;">Please do not close this window.</p>
        </div>
    </div>

    <script>
        function selectMethod(element) {
            // Remove selected class from all options
            document.querySelectorAll('.option-label').forEach(el => el.classList.remove('selected'));
            // Add selected class to clicked option
            element.classList.add('selected');
            // Check the radio input
            element.querySelector('input').checked = true;
        }

        document.getElementById('paymentForm').addEventListener('submit', function() {
            document.getElementById('loadingOverlay').classList.add('active');
            
            // Disable button to prevent double submission
            const btn = document.getElementById('submitBtn');
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
        });
    </script>
</body>
</html>