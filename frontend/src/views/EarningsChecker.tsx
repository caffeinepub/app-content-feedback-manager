import React, { useState } from 'react';
import { Search, Wallet, CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import { useSubmitPayoutRequest } from '../hooks/useQueries';
import type { Earning } from '../backend';
import { toast } from 'sonner';

type Step = 'lookup' | 'wallet' | 'success';

export function EarningsChecker() {
  const { actor } = useActor();
  const [step, setStep] = useState<Step>('lookup');
  const [username, setUsername] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [earning, setEarning] = useState<Earning | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLooking, setIsLooking] = useState(false);

  const submitPayout = useSubmitPayoutRequest();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !username.trim()) return;

    setIsLooking(true);
    setNotFound(false);
    setEarning(null);

    try {
      const result = await actor.getEarning(username.trim());
      if (result) {
        setEarning(result);
        setStep('wallet');
      } else {
        setNotFound(true);
      }
    } catch {
      toast.error('Failed to look up earnings. Please try again.');
    } finally {
      setIsLooking(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWalletPhone(val);
    if (phoneError) validatePhone(val);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earning) return;
    if (!validatePhone(walletPhone)) return;

    try {
      await submitPayout.mutateAsync({
        username: earning.username,
        totalAmount: earning.totalAmount,
        walletPhone,
      });
      setStep('success');
    } catch {
      toast.error('Failed to submit payout request. Please try again.');
    }
  };

  const handleReset = () => {
    setStep('lookup');
    setUsername('');
    setWalletPhone('');
    setPhoneError('');
    setEarning(null);
    setNotFound(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-card p-5 rounded-2xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg gradient-heading">Earnings Checker</h2>
            <p className="text-xs text-muted-foreground">Check your earnings and request a payout</p>
          </div>
        </div>
      </div>

      {/* Step: Lookup */}
      {step === 'lookup' && (
        <div className="space-card p-6 rounded-2xl">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Check Your Earnings
          </h3>
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLooking}
                autoFocus
              />
            </div>

            {notFound && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No earnings found for <strong>{username}</strong>. Please check your username and try again.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLooking || !username.trim()}
              className="gradient-button w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLooking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Earnings
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step: Wallet */}
      {step === 'wallet' && earning && (
        <div className="space-y-4">
          {/* Earnings Found Card */}
          <div className="space-card p-6 rounded-2xl border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Earnings Found!</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-semibold text-foreground">{earning.username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold gradient-heading">₹{Number(earning.totalAmount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Wallet Phone Form */}
          <div className="space-card p-6 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Enter Wallet Number
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Enter your 10-digit phone number to receive your payout</p>

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Phone Number (Wallet)</label>
                <input
                  type="tel"
                  value={walletPhone}
                  onChange={handlePhoneChange}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className={`w-full px-4 py-3 rounded-xl bg-background/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 tracking-widest text-lg font-mono ${
                    phoneError ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={submitPayout.isPending}
                  autoFocus
                />
                {phoneError && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {phoneError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{walletPhone.length}/10 digits</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium transition-colors"
                  disabled={submitPayout.isPending}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitPayout.isPending || walletPhone.length !== 10}
                  className="flex-2 flex-grow py-3 rounded-xl gradient-button font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitPayout.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Submit Payout Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && earning && (
        <div className="space-card p-8 rounded-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold gradient-heading mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground mb-1">
            Your payout request for <strong className="text-foreground">₹{Number(earning.totalAmount).toLocaleString()}</strong> has been submitted.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Wallet: <span className="font-mono text-foreground">{walletPhone}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-6 bg-muted/30 rounded-xl px-4 py-3">
            Your request is now pending admin approval. You will be notified once it is processed.
          </p>
          <button
            onClick={handleReset}
            className="gradient-button px-6 py-2.5 rounded-xl font-semibold text-white"
          >
            Check Another Username
          </button>
        </div>
      )}
    </div>
  );
}
