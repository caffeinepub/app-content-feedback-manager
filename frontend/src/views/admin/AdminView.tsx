import { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminUnlock } from '../../components/AdminUnlock';
import { AdminComments } from './AdminComments';
import AdminAITemplates from './AdminAITemplates';
import { AdminImages } from './AdminImages';
import { AdminChat } from './AdminChat';
import AdminLiveList from './AdminLiveList';
import AdminSettings from './AdminSettings';
import { MessageSquare, Sparkles, ImageIcon, MessagesSquare, Users, Settings } from 'lucide-react';

type AdminTab = 'comments' | 'ai' | 'images' | 'chat' | 'livelist' | 'settings';

const adminTabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Templates', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'images', label: 'Images', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'chat', label: 'Chat', icon: <MessagesSquare className="w-4 h-4" /> },
  { id: 'livelist', label: 'Live List', icon: <Users className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export function AdminView() {
  const { isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('comments');

  if (!isAdmin) {
    return <AdminUnlock />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold neon-text">Admin Panel</h2>
        <p className="text-muted-foreground mt-1">Manage your content and settings</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1" style={{ scrollbarWidth: 'none' }}>
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-white shadow-neon'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' } : {}}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'comments' && <AdminComments />}
        {activeTab === 'ai' && <AdminAITemplates />}
        {activeTab === 'images' && <AdminImages />}
        {activeTab === 'chat' && <AdminChat />}
        {activeTab === 'livelist' && <AdminLiveList />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
