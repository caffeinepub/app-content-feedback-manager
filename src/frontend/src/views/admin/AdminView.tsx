import {
  CreditCard,
  Database,
  DollarSign,
  Image,
  List,
  Lock,
  MessageCircle,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import AdminUnlock from "../../components/AdminUnlock";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import AdminAITemplates from "./AdminAITemplates";
import { AdminChat } from "./AdminChat";
import AdminComments from "./AdminComments";
import AdminEarnings from "./AdminEarnings";
import { AdminImages } from "./AdminImages";
import AdminLiveList from "./AdminLiveList";
import AdminPoolManagement from "./AdminPoolManagement";
import AdminPricing from "./AdminPricing";
import AdminSettings from "./AdminSettings";
import AdminWithdrawals from "./AdminWithdrawals";

const tabs = [
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "live", label: "Live List", icon: List },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "earnings", label: "Earnings", icon: TrendingUp },
  { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
  { id: "ai", label: "AI Templates", icon: Sparkles },
  { id: "images", label: "Images", icon: Image },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "pool", label: "Pool Mgmt", icon: Database },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminView() {
  const [activeTab, setActiveTab] = useState("comments");
  const { isUnlocked, lockAdmin } = useAdminAuth();

  if (!isUnlocked) {
    return <AdminUnlock onUnlocked={() => {}} />;
  }

  return (
    <div className="space-y-4">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold gradient-text">Admin Panel</h2>
        </div>
        <button
          type="button"
          onClick={lockAdmin}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
        >
          <Lock className="w-3.5 h-3.5" />
          Lock
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-xl border border-border/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "comments" && <AdminComments />}
        {activeTab === "live" && <AdminLiveList />}
        {activeTab === "pricing" && <AdminPricing />}
        {activeTab === "earnings" && <AdminEarnings />}
        {activeTab === "withdrawals" && <AdminWithdrawals />}
        {activeTab === "ai" && <AdminAITemplates />}
        {activeTab === "images" && <AdminImages />}
        {activeTab === "chat" && <AdminChat />}
        {activeTab === "pool" && <AdminPoolManagement />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}
