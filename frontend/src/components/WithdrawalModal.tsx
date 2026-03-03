import { useState } from 'react';
import { X, Wallet, CheckCircle, Loader2, DollarSign, User } from 'lucide-react';
import { useCheckAndRequestWithdrawal } from '../hooks/useQueries';

interface WithdrawalModalProps {
  username: string;
  totalEarnings: number;
  onClose: () => void;
}

export default function WithdrawalModal({ username, totalEarnings, onClose }: WithdrawalModalProps) {
  const [walletNumber, setWalletNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  const withdrawalMutation = useCheckAndRequestWithdrawal();

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWalletNumber(val);
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walletNumber.length !== 10) {
      setValidationError('Wallet number must be exactly 10 digits.');
      return;
    }
    try {
      await withdrawalMutation.mutateAsync({ username, walletNumber });
      setSubmitted(true);
    } catch (err: any) {
      setValidationError(err?.message ?? 'Submission failed. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content w-full max-w-md mx-4">
        <div className="glass-card-gold p-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
            style={{
              background: 'oklch(0.16 0.04 260 / 0.6)',
              border: '1px solid oklch(0.28 0.06 260 / 0.4)',
              color: 'oklch(0.60 0.04 260)',
            }}
          >
            <X className="w-4 h-4" />
          </button>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-gold"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.75 0.18 65 / 0.2), oklch(0.70 0.20 185 / 0.2))',
                    border: '1px solid oklch(0.75 0.18 65 / 0.4)',
                  }}
                >
                  <DollarSign className="w-8 h-8" style={{ color: 'oklch(0.82 0.20 70)' }} />
                </div>
                <h2 className="font-orbitron font-bold text-xl gradient-heading mb-1">
                  Earnings Found!
                </h2>
                <p className="text-sm font-rajdhani" style={{ color: 'oklch(0.60 0.04 260)' }}>
                  Submit your withdrawal request below
                </p>
              </div>

              {/* Earnings info */}
              <div
                className="rounded-xl p-4 mb-5 space-y-3"
                style={{
                  background: 'oklch(0.10 0.025 260 / 0.8)',
                  border: '1px solid oklch(0.28 0.06 260 / 0.4)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: 'oklch(0.70 0.20 185)' }} />
                    <span className="text-sm font-rajdhani" style={{ color: 'oklch(0.60 0.04 260)' }}>Username</span>
                  </div>
                  <span className="font-orbitron font-bold text-sm" style={{ color: 'oklch(0.90 0.05 80)' }}>
                    {username}
                  </span>
                </div>
                <div className="section-divider my-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: 'oklch(0.82 0.20 70)' }} />
                    <span className="text-sm font-rajdhani" style={{ color: 'oklch(0.60 0.04 260)' }}>Total Earnings</span>
                  </div>
                  <span className="font-orbitron font-bold text-lg gold-text">
                    ₹{totalEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Wallet form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-rajdhani font-600 mb-2" style={{ color: 'oklch(0.75 0.10 80)' }}>
                    <Wallet className="w-4 h-4 inline mr-1.5" style={{ color: 'oklch(0.70 0.20 185)' }} />
                    Wallet Number (10-digit phone)
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={walletNumber}
                    onChange={handleWalletChange}
                    placeholder="Enter 10-digit phone number"
                    required
                    maxLength={10}
                    className="glass-input w-full px-4 py-3 text-base"
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      letterSpacing: '0.1em',
                    }}
                  />
                  {validationError && (
                    <p className="mt-1.5 text-xs font-rajdhani animate-fadeIn" style={{ color: 'oklch(0.65 0.22 25)' }}>
                      {validationError}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs font-rajdhani" style={{ color: 'oklch(0.45 0.04 260)' }}>
                    {walletNumber.length}/10 digits entered
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-rajdhani font-600 text-sm transition-all duration-300 hover-lift"
                    style={{
                      background: 'oklch(0.14 0.03 260 / 0.6)',
                      border: '1px solid oklch(0.28 0.06 260 / 0.4)',
                      color: 'oklch(0.60 0.04 260)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawalMutation.isPending || walletNumber.length !== 10}
                    className="flex-1 py-3 rounded-xl font-orbitron font-bold text-sm transition-all duration-300 hover-lift flex items-center justify-center gap-2"
                    style={{
                      background: walletNumber.length === 10
                        ? 'linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))'
                        : 'oklch(0.16 0.03 260)',
                      color: walletNumber.length === 10 ? 'oklch(0.08 0.02 260)' : 'oklch(0.40 0.04 260)',
                      boxShadow: walletNumber.length === 10
                        ? '0 4px 15px oklch(0.75 0.18 65 / 0.3)'
                        : 'none',
                    }}
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4 animate-fadeInUp">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: 'oklch(0.65 0.18 145 / 0.15)',
                  border: '2px solid oklch(0.65 0.18 145 / 0.5)',
                }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: 'oklch(0.72 0.20 145)' }} />
              </div>
              <h3 className="font-orbitron font-bold text-xl mb-2" style={{ color: 'oklch(0.72 0.20 145)' }}>
                Request Submitted!
              </h3>
              <p className="font-rajdhani text-sm mb-1" style={{ color: 'oklch(0.70 0.04 260)' }}>
                Your withdrawal request has been sent.
              </p>
              <p className="font-rajdhani text-xs mb-6" style={{ color: 'oklch(0.50 0.04 260)' }}>
                Admin will review and approve shortly.
              </p>
              <div
                className="rounded-xl p-3 mb-5 text-left space-y-2"
                style={{
                  background: 'oklch(0.10 0.025 260 / 0.8)',
                  border: '1px solid oklch(0.28 0.06 260 / 0.4)',
                }}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>Username:</span>
                  <span className="font-orbitron font-bold text-xs" style={{ color: 'oklch(0.85 0.05 80)' }}>{username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>Amount:</span>
                  <span className="font-orbitron font-bold text-xs gold-text">₹{totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>Wallet:</span>
                  <span className="font-orbitron font-bold text-xs" style={{ color: 'oklch(0.70 0.20 185)' }}>{walletNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-rajdhani" style={{ color: 'oklch(0.55 0.04 260)' }}>Status:</span>
                  <span className="badge-pending">PENDING</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-orbitron font-bold text-sm transition-all duration-300 hover-lift"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))',
                  color: 'oklch(0.08 0.02 260)',
                  boxShadow: '0 4px 15px oklch(0.75 0.18 65 / 0.3)',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
