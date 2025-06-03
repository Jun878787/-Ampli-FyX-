import { Card, CardContent } from "@/components/ui/card";
import { Database, PlayCircle, CheckCircle, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalCollected: number;
    activeTasks: number;
    successRate: string;
    todayCollected: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "總收集數量",
      value: stats.totalCollected.toLocaleString(),
      icon: Database,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12.5%",
      trendLabel: "較上月"
    },
    {
      title: "活躍任務",
      value: stats.activeTasks.toString(),
      icon: PlayCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: "3 個運行中",
      trendLabel: ""
    },
    {
      title: "成功率",
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "優秀",
      trendLabel: ""
    },
    {
      title: "今日收集",
      value: stats.todayCollected.toLocaleString(),
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      trend: "較昨日 +8%",
      trendLabel: ""
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.iconColor} h-6 w-6`} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-green-600 font-medium">{card.trend}</span>
                {card.trendLabel && (
                  <span className="text-slate-500 ml-2">{card.trendLabel}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
