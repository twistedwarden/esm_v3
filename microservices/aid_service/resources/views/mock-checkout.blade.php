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
            background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
            z-index: -1;
        }

        .checkout-wrapper {
            width: 100%;
            max-width: 400px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
            overflow: visible; /* Allow dropdown to overflow */
            position: relative;
        }

        .header {
            padding: 24px 28px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            color: #0f172a;
        }

        .main-content {
            padding: 28px;
        }

        .amount-display {
            text-align: center;
            margin-bottom: 28px;
        }

        .amount-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .amount-value {
            font-size: 2.25rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
        }

        /* Custom Dropdown Styling */
        .custom-dropdown-container {
            position: relative;
            margin-bottom: 24px;
        }

        .dropdown-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            color: #334155;
            margin-bottom: 10px;
        }

        .dropdown-selected {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            font-size: 0.95rem;
            font-weight: 500;
            color: #1e293b;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .dropdown-selected:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
        }

        .dropdown-selected.active {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .dropdown-options {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            margin-top: 8px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 50;
            overflow: hidden;
        }

        .dropdown-options.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .dropdown-option {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: background 0.1s;
        }

        .dropdown-option:hover {
            background-color: #f1f5f9;
        }

        .dropdown-option.selected {
            background-color: #eff6ff;
            color: #4f46e5;
            font-weight: 500;
        }

        .method-icon-container {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;
        }

        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .submit-btn {
            width: 100%;
            padding: 16px;
            background: #0f172a;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .submit-btn:hover {
            background: #1e293b;
            transform: translateY(-1px);
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
            padding: 20px;
            text-align: center;
            font-size: 0.75rem;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            background: #f8fafc;
            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
        }

        /* Loading State */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.98);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 100;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            border-radius: 20px;
        }

        .loading-overlay.active {
            opacity: 1;
            pointer-events: all;
        }

        .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #e2e8f0;
            border-top-color: #0f172a;
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4f46e5;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                <span>EduAid</span>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">
                TEST MODE
            </div>
        </div>

        <!-- Main Body -->
        <div class="main-content">
            
            <div class="amount-display">
                <div class="amount-label">Amount Due</div>
                <div class="amount-value">₱{{ number_format($amount, 2) }}</div>
            </div>

            <form action="{{ route('payment.mock-complete', ['id' => $paymentId]) }}" method="POST" id="paymentForm">
                @csrf
                <input type="hidden" name="application_id" value="{{ $applicationId }}">
                <!-- Hidden input to store selected value -->
                <input type="hidden" name="method" id="methodInput" value="{{ request('method', 'gcash') }}">
                
                @php $preferred = request('method', 'gcash'); @endphp

                <div class="custom-dropdown-container">
                    <label class="dropdown-label">Payment Method</label>
                    
                    <div class="dropdown-selected" id="dropdownTrigger">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="method-icon-container" id="selectedIcon">
                                <!-- Icon injected via JS -->
                            </div>
                            <span id="selectedText">Select Method</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #94a3b8;"><path d="M6 9l6 6 6-6"/></svg>
                    </div>

                    <div class="dropdown-options" id="dropdownOptions">
                        <!-- GCash -->
                        <div class="dropdown-option" data-value="gcash" onclick="selectOption('gcash', 'GCash', '#007DFE')">
                            <div class="method-icon-container">
                                <span style="font-weight: 700; color: #007DFE; font-size: 0.8rem;">G</span>
                            </div>
                            <span>GCash</span>
                        </div>
                        
                        <!-- Maya -->
                        <div class="dropdown-option" data-value="maya" onclick="selectOption('maya', 'Maya', '#6f21ef')">
                            <div class="method-icon-container">
                                <span style="font-weight: 700; color: #6f21ef; font-size: 0.8rem;">M</span>
                            </div>
                            <span>Maya</span>
                        </div>

                        <!-- Card -->
                        <div class="dropdown-option" data-value="card" onclick="selectOption('card', 'Credit / Debit Card', '#0f172a')">
                            <div class="method-icon-container">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                            </div>
                            <span>Credit / Debit Card</span>
                        </div>

                        <!-- Bank -->
                        <div class="dropdown-option" data-value="bank_transfer" onclick="selectOption('bank_transfer', 'Bank Transfer', '#64748b')">
                            <div class="method-icon-container">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M3 21h18M5 21v-7M19 21v-7M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3H4v-3zM12 3v3"/></svg>
                            </div>
                            <span>Bank Transfer</span>
                        </div>
                    </div>
                </div>

                <div class="btn-group">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
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
            <div style="display: flex; justify-content: center; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secured by PayMongo
            </div>
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner"></div>
            <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Processing</h4>
            <p style="color: #64748b; font-size: 0.8rem;">Confirming payment...</p>
        </div>
    </div>

    <script>
        // Icons config
        const icons = {
            gcash: '<span style="font-weight: 700; color: #007DFE; font-size: 0.8rem;">G</span>',
            maya: '<span style="font-weight: 700; color: #6f21ef; font-size: 0.8rem;">M</span>',
            card: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
            bank_transfer: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M3 21h18M5 21v-7M19 21v-7M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3H4v-3zM12 3v3"/></svg>'
        };

        const names = {
            gcash: 'GCash',
            maya: 'Maya',
            card: 'Credit / Debit Card',
            bank_transfer: 'Bank Transfer'
        };

        // Initialize state
        let isOpen = false;
        const trigger = document.getElementById('dropdownTrigger');
        const options = document.getElementById('dropdownOptions');
        const input = document.getElementById('methodInput');
        const selectedText = document.getElementById('selectedText');
        const selectedIcon = document.getElementById('selectedIcon');
        
        // Initial selection from server preferred value
        const initialMethod = "{{ $preferred }}";
        if(icons[initialMethod]) {
            selectedIcon.innerHTML = icons[initialMethod];
            selectedText.innerText = names[initialMethod];
            input.value = initialMethod;
            
            // Mark option as selected
            document.querySelectorAll('.dropdown-option').forEach(el => {
                if(el.dataset.value === initialMethod) el.classList.add('selected');
            });
        }

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            trigger.classList.toggle('active', isOpen);
            options.classList.toggle('show', isOpen);
        });

        // Close on click outside
        document.addEventListener('click', () => {
            if(isOpen) {
                isOpen = false;
                trigger.classList.remove('active');
                options.classList.remove('show');
            }
        });

        // Select option function
        window.selectOption = function(value, name, color) {
            input.value = value;
            selectedText.innerText = name;
            selectedIcon.innerHTML = icons[value];
            
            // Update UI classes
            document.querySelectorAll('.dropdown-option').forEach(el => el.classList.remove('selected'));
            document.querySelector(`.dropdown-option[data-value="${value}"]`).classList.add('selected');
            
            // Close dropdown
            isOpen = false;
            trigger.classList.remove('active');
            options.classList.remove('show');
        };

        // Form submit
        document.getElementById('paymentForm').addEventListener('submit', function() {
            document.getElementById('loadingOverlay').classList.add('active');
            const btn = document.getElementById('submitBtn');
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
        });
    </script>
</body>
</html>