import { useState } from 'react';
import { Lock, MessageSquare, List, DollarSign, BarChart2, Settings, Wallet, Image, Sparkles } from 'lucide-react';
import AdminUnlock from '../../components/AdminUnlock';
import AdminComments from './AdminComments';
import AdminLiveList from './AdminLiveList';
import AdminPricing from './AdminPricing';
import AdminEarnings from './AdminEarnings';
import AdminSettings from './AdminSettings';
import AdminWithdrawals from './AdminWithdrawals';
import { AdminChat } from './AdminChat';
import { AdminImages } from './AdminImages';
import AdminAITemplates from './AdminAITemplates';
import { useAdminAuth } from '../../hooks/useAdminAuth';

type AdminTab = 'comments' | 'livelist' | 'pricing' | 'earnings' | 'withdrawals' | 'settings' | 'chat' | 'images' | 'ai-templates';

export default function AdminView() {
  const { isUnlocked, lockAdmin } = useAdminAuth();
  const [forceUnlocked, setForceUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('comments');

  const isAdminVisible = isUnlocked || forceUnlocked;

  if (!isAdminVisible) {
    return (
      <AdminUnlock onUnlocked={() => setForceUnlocked(true)} />
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'comments', label: 'Comments', icon: List },
    { id: 'livelist', label: 'Live List', icon: MessageSquare },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'earnings', label: 'Earnings', icon: BarChart2 },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'ai-templates', label: 'AI Templates', icon: Sparkles },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Admin Header */}
      <div className="glass-card-gold p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.75 0.18 65 / 0.3), oklch(0.70 0.20 185 / 0.3))',
              border: '1px solid oklch(0.75 0.18 65 / 0.4)',
            }}
          >
            <Lock className="w-4 h-4" style={{ color: 'oklch(0.82 0.20 70)' }} />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-sm gradient-heading">Admin Panel</h2>
            <p className="text-xs font-rajdhani" style={{ color: 'oklch(0.50 0.04 260)' }}>Full access granted</p>
          </div>
        </div>
        <button
          onClick={lockAdmin}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-rajdhani font-600 text-xs transition-all duration-300 hover-lift"
          style={{
            background: 'oklch(0.55 0.22 25 / 0.15)',
            border: '1px solid oklch(0.55 0.22 25 / 0.3)',
            color: 'oklch(0.65 0.22 25)',
          }}
        >
          <Lock className="w-3.5 h-3.5" />
          Lock Admin
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-1.5 rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-rajdhani font-600 text-xs transition-all duration-300"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, oklch(0.75 0.18 65 / 0.25), oklch(0.70 0.20 185 / 0.25))'
                    : 'transparent',
                  color: isActive ? 'oklch(0.90 0.10 80)' : 'oklch(0.50 0.04 260)',
                  border: isActive ? '1px solid oklch(0.75 0.18 65 / 0.3)' : '1px solid transparent',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeInUp">
        {activeTab === 'comments' && <AdminComments />}
        {activeTab === 'livelist' && <AdminLiveList />}
        {activeTab === 'pricing' && <AdminPricing />}
        {activeTab === 'earnings' && <AdminEarnings />}
        {activeTab === 'withdrawals' && <AdminWithdrawals />}
        {activeTab === 'ai-templates' && <AdminAITemplates />}
        {activeTab === 'images' && <AdminImages />}
        {activeTab === 'chat' && <AdminChat />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
