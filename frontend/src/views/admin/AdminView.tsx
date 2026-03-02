import { useState } from 'react';
import AdminUnlock from '../../components/AdminUnlock';
import AdminComments from './AdminComments';
import AdminLiveList from './AdminLiveList';
import AdminPricing from './AdminPricing';
import AdminEarnings from './AdminEarnings';
import AdminEarningsManagement from './AdminEarningsManagement';
import AdminPayoutRequests from './AdminPayoutRequests';
import AdminDangerZone from './AdminDangerZone';
import AdminSettings from './AdminSettings';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Shield, AlertCircle } from 'lucide-react';

const ADMIN_TABS = [
  { id: 'comments', label: 'Comments' },
  { id: 'livelist', label: 'Live List' },
  { id: 'pricing', label: 'App Pricing' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'earningsMgmt', label: 'Earnings Mgmt' },
  { id: 'payouts', label: 'Payout Requests' },
  { id: 'danger', label: 'Danger Zone' },
  { id: 'settings', label: 'Settings' },
] as const;

type AdminTabId = typeof ADMIN_TABS[number]['id'];

export default function AdminView() {
  const { isUnlocked, lockAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabId>('comments');
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error?.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    lockAdmin();
  };

  // Show loading while identity is initializing
  if (isInitializing) {
    return (
      <div className="space-card rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  // Must be logged in with Internet Identity first
  if (!isAuthenticated) {
    return (
      <div className="space-card rounded-2xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Admin Access</h2>
          <p className="text-sm text-muted-foreground">
            You must log in with Internet Identity to access the Admin panel.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Admin actions require authentication to verify your identity on the Internet Computer.
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="gradient-button w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoggingIn ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Login with Internet Identity
            </>
          )}
        </button>
      </div>
    );
  }

  // Logged in but not unlocked as admin yet
  if (!isUnlocked) {
    return (
      <div className="space-y-3">
        {/* Logged-in indicator */}
        <div className="space-card rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground">Logged in with Internet Identity</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-card/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
        <AdminUnlock onUnlocked={() => {}} />
      </div>
    );
  }

  // Fully authenticated and admin unlocked
  return (
    <div className="space-y-4">
      {/* Admin header with logout */}
      <div className="space-card rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">Admin Panel</span>
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
            Authenticated
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-card/60"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 bg-card/40 border border-border/30 rounded-2xl p-1 min-w-max">
          {ADMIN_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? id === 'danger'
                    ? 'bg-destructive text-destructive-foreground shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : id === 'danger'
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Tab Content */}
      <div>
        {activeTab === 'comments' && <AdminComments />}
        {activeTab === 'livelist' && <AdminLiveList />}
        {activeTab === 'pricing' && <AdminPricing />}
        {activeTab === 'earnings' && <AdminEarnings />}
        {activeTab === 'earningsMgmt' && <AdminEarningsManagement />}
        {activeTab === 'payouts' && <AdminPayoutRequests />}
        {activeTab === 'danger' && <AdminDangerZone />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
