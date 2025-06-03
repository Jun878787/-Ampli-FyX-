import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

export default function RealTimeStatus() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const runningTasks = tasks?.filter((task: any) => task.status === "running") || [];

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">實時狀態</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">系統狀態</span>
          <span className="flex items-center text-green-600 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            運行中
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">CPU 使用率</span>
          <span className="text-slate-800 font-medium">{stats?.cpuUsage || "0%"}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">記憶體使用</span>
          <span className="text-slate-800 font-medium">{stats?.memoryUsage || "0 GB"}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">網路狀況</span>
          <span className="text-green-600 font-medium">
            {stats?.networkStatus === "good" ? "良好" : "一般"}
          </span>
        </div>
        
        <div className="pt-4 border-t border-slate-200">
          <h4 className="font-medium text-slate-800 mb-3">當前任務進度</h4>
          <div className="space-y-3">
            {runningTasks.length === 0 ? (
              <p className="text-sm text-slate-500">暫無運行中的任務</p>
            ) : (
              runningTasks.map((task: any) => (
                <div key={task.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{task.name}</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
