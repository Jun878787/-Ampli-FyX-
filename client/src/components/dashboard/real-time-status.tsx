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
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-semibold text-card-foreground">實時狀態</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">系統狀態</span>
          <span className="flex items-center text-green-400 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            運行中
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">CPU 使用率</span>
          <span className="text-card-foreground font-medium">{stats?.cpuUsage || "0%"}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">記憶體使用</span>
          <span className="text-card-foreground font-medium">{stats?.memoryUsage || "0 GB"}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">網路狀況</span>
          <span className="text-green-400 font-medium">
            {stats?.networkStatus === "good" ? "良好" : "一般"}
          </span>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium text-card-foreground mb-3">當前任務進度</h4>
          <div className="space-y-3">
            {runningTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">暫無運行中的任務</p>
            ) : (
              runningTasks.map((task: any) => (
                <div key={task.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{task.name}</span>
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
