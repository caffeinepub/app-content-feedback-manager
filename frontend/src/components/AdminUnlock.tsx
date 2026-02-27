import { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck } from 'lucide-react';

export function AdminUnlock() {
  const { unlock, error, setError } = useAdminAuth();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unlock(code);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="glass-card rounded-2xl p-8 w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Admin Access</h2>
          <p className="text-muted-foreground mt-1 text-sm">Enter your 4-digit admin code</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Enter code..."
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError('');
            }}
            className="text-center text-2xl tracking-widest bg-secondary border-border focus:border-neon-teal"
          />
          {error && (
            <p className="text-destructive text-sm font-medium animate-fade-in">{error}</p>
          )}
          <Button type="submit" className="w-full gradient-btn text-white font-semibold">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Unlock Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
