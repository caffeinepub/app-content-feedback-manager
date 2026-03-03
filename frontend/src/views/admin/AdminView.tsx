import React, { useState } from 'react';
import { Lock, MessageSquare, List, DollarSign, BarChart2, Settings, Wallet, Image, Sparkles } from 'lucide-react';
import AdminUnlock from '../../components/AdminUnlock';
import AdminComments from './AdminComments';
import AdminLiveList from './AdminLiveList';
import AdminPricing from './AdminPricing';
import AdminEarnings from './AdminEarnings';
import AdminSettings from './AdminSettings';
import AdminWithdrawals from './AdminWithdrawals';
import AdminChat from './AdminChat';
import AdminImages from './AdminImages';
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
    <div className="space-y-4">
      {/* Admin Header */}
      <div className="space-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Manage your Reviews World app</p>
          </div>
        </div>
        <button
          onClick={lockAdmin}
          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
        >
          Lock
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
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
