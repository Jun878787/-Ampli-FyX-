import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  Search, 
  Database, 
  Download, 
  BarChart3, 
  Settings,
  User,
  Users,
  MessageSquare,
  Bot,
  Globe,
  UserPlus,
  Megaphone,
  Zap,
  Menu,
  ChevronLeft,
  Key
} from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "控制台", href: "/", icon: Gauge },
  { name: "數據採集", href: "/data-collection", icon: Search },
  { name: "數據管理", href: "/data-management", icon: Database },
  { name: "導出數據", href: "/export-data", icon: Download },
  { name: "數據分析", href: "/analytics", icon: BarChart3 },
  { name: "設置", href: "/settings", icon: Settings },
];

const facebookNavigation = [
  { name: "帳號管理", href: "/facebook-account-manager", icon: User },
  { name: "批量產號", href: "/facebook-account-generation", icon: UserPlus },
  { name: "批量養號", href: "/facebook-batch-management", icon: Zap },
  { name: "API測試", href: "/facebook-api-test", icon: Globe },
  { name: "自動訊息", href: "/auto-messaging", icon: MessageSquare },
  { name: "廣告分析", href: "/facebook-ads-analytics", icon: BarChart3 },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn(
      "bg-slate-800 shadow-lg flex-shrink-0 transition-all duration-300 flex flex-col h-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("p-6 border-b border-slate-700", isCollapsed && "p-4")}>
        <div className="flex items-center justify-between relative">
          <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <SiFacebook className="text-white text-lg" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-slate-100">North™Sea</h1>
                <p className="text-sm text-slate-400">北金國際 數據採集</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "hover:bg-slate-700 text-slate-400 hover:text-slate-100",
              isCollapsed ? "absolute -right-2 top-0" : "ml-auto"
            )}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              系統功能
            </h3>
          )}
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Link href={item.href} className={cn(
                    "flex items-center px-3 py-2 rounded-lg font-medium transition-colors",
                    isCollapsed ? "justify-center" : "space-x-3",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Facebook 管理
            </h3>
          )}
          <ul className="space-y-2">
            {facebookNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Link href={item.href} className={cn(
                    "flex items-center px-3 py-2 rounded-lg font-medium transition-colors",
                    isCollapsed ? "justify-center" : "space-x-3",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
