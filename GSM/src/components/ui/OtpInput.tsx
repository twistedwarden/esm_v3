import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    disabled?: boolean;
    error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
    length = 6,
    onComplete,
    disabled = false,
    error = false
}) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0] && !disabled) {
            inputRefs.current[0].focus();
        }
    }, [disabled]);

    useEffect(() => {
        // Check if OTP is complete
        if (otp.every(digit => digit !== '')) {
            onComplete(otp.join(''));
        }
    }, [otp, onComplete]);

    const handleChange = (index: number, value: string) => {
        if (disabled) return;

        // Only allow numbers
        const sanitizedValue = value.replace(/[^0-9]/g, '');

        if (sanitizedValue.length > 1) {
            // Handle paste
            handlePaste(sanitizedValue, index);
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = sanitizedValue;
        setOtp(newOtp);

        // Auto-focus next input
        if (sanitizedValue && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (pastedData: string, startIndex: number = 0) => {
        const digits = pastedData.replace(/[^0-9]/g, '').split('');
        const newOtp = [...otp];

        digits.forEach((digit, i) => {
            const index = startIndex + i;
            if (index < length) {
                newOtp[index] = digit;
            }
        });

        setOtp(newOtp);

        // Focus the last filled input or the next empty one
        const lastFilledIndex = Math.min(startIndex + digits.length - 1, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        handlePaste(pastedData, index);
    };

    const handleFocus = (index: number) => {
        // Select the content when focused
        inputRefs.current[index]?.select();
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={e => handlePasteEvent(e, index)}
                    onFocus={() => handleFocus(index)}
                    disabled={disabled}
                    className={`
						w-12 h-14 text-center text-2xl font-semibold
						border-2 rounded-lg
						transition-all duration-200
						focus:outline-none focus:ring-2
						${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:border-orange-500 focus:ring-orange-200'
                        }
						${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
						${digit ? 'border-orange-500' : ''}
					`}
                    aria-label={`OTP digit ${index + 1}`}
                />
            ))}
        </div>
    );
};
