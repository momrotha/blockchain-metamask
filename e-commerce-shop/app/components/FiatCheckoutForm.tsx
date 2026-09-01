'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faLock } from '@fortawesome/free-solid-svg-icons';

// Standard Luhn Algorithm for real credit card checksum validation
const isValidLuhn = (numStr: string): boolean => {
  let sum = 0;
  let double = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let digit = parseInt(numStr.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};

export default function FiatCheckoutForm({ 
  amount, 
  onSuccess, 
  onFailure,
  onCancel 
}: { 
  amount: string; 
  onSuccess: () => void;
  onFailure?: (reason: string) => void;
  onCancel: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [simulateFail, setSimulateFail] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const toastId = toast.loading("Processing card payment...");
    
    const cleanCard = cardNumber.replace(/\s/g, '');
    let failureReason: string | null = null;

    if (simulateFail) {
      failureReason = "Card declined: Simulated bank security block";
    } else if (cleanCard.length < 16) {
      failureReason = "Card declined: Invalid card length (must be 16 digits)";
    } else if (cleanCard.startsWith("0") || cleanCard.startsWith("1") || cleanCard.startsWith("7") || cleanCard.startsWith("8") || cleanCard.startsWith("9")) {
      failureReason = "Card declined: Unsupported card network or invalid prefix";
    } else if (!isValidLuhn(cleanCard)) {
      failureReason = "Card declined: Invalid card number (checksum validation failed)";
    } else if (expiry.length < 5) {
      failureReason = "Card declined: Incomplete expiration date";
    } else {
      const [mmStr, yyStr] = expiry.split('/');
      const month = parseInt(mmStr, 10);
      const year = parseInt('20' + yyStr, 10);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (isNaN(month) || month < 1 || month > 12) {
        failureReason = "Card declined: Invalid expiration month (must be 01-12)";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        failureReason = `Card declined: Expired card (${expiry} is in the past)`;
      }
    }

    if (!failureReason && cvc.length < 3) {
      failureReason = "Card declined: Invalid security code (CVC)";
    }

    setTimeout(() => {
      setIsProcessing(false);
      if (failureReason) {
        toast.error(`Payment Failed! ${failureReason}`, { id: toastId });
        if (onFailure) onFailure(failureReason);
      } else {
        toast.success("Payment Successful!", { id: toastId });
        onSuccess();
      }
    }, 2000);
  };

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faCreditCard} className="text-2xl text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Secure Card Payment</h3>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 cursor-pointer">
          <input 
            type="checkbox" 
            checked={simulateFail} 
            onChange={(e) => setSimulateFail(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500"
          />
          Simulate Bank Block
        </label>
      </div>

      {/* Real Validation Hint Box */}
      <div className="mb-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
        <p className="font-bold flex items-center gap-1 text-blue-800">💡 Card Validation Rules:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[0.75rem] text-gray-600">
          <p>• Fake Card (e.g. <span className="font-mono font-semibold text-gray-800">1111 1111 1111 1111</span>) → Checksum Fail</p>
          <p>• Invalid Prefix (e.g. <span className="font-mono font-semibold text-gray-800">0000 0000 0000 0000</span>) → Unsupported Network</p>
          <p>• Expired Date (e.g. <span className="font-mono font-semibold text-gray-800">05/22</span>) → Expired Card</p>
          <p>• Valid Card (e.g. <span className="font-mono font-semibold text-gray-800">4111 1111 1111 1111</span> + <span className="font-mono font-semibold text-gray-800">12/28</span>) → Success ✅</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name on Card</label>
          <input 
            type="text" 
            required 
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label>
          <div className="relative">
            <input 
              type="text" 
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition pl-10"
              placeholder="0000 0000 0000 0000"
            />
            <FontAwesomeIcon icon={faCreditCard} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
            <input 
              type="text" 
              required 
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">CVC</label>
            <input 
              type="password" 
              required 
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              placeholder="123"
              maxLength={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </div>
        </div>
        
        <div className="pt-4 flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-2/3 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FontAwesomeIcon icon={faLock} /> Pay ${amount}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
