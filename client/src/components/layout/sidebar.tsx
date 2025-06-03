import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  Search, 
  Database, 
  Download, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "控制台", href: "/", icon: Gauge },
  { name: "數據採集", href: "/data-collection", icon: Search },
  { name: "數據管理", href: "/data-management", icon: Database },
  { name: "導出數據", href: "/export-data", icon: Download },
  { name: "數據分析", href: "/analytics", icon: BarChart3 },
  { name: "設置", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-fb-blue rounded-lg flex items-center justify-center">
            <SiFacebook className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">North™Sea</h1>
            <p className="text-sm text-slate-500">北金國際 數據採集</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}>
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
