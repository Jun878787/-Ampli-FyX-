import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import CollectionPanel from "@/components/dashboard/collection-panel";
import RealTimeStatus from "@/components/dashboard/real-time-status";
import DataTable from "@/components/dashboard/data-table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const handleDataCollection = async () => {
    try {
      const pendingTask = Array.isArray(tasks) ? tasks.find((task: any) => task.status === "pending") : null;
      if (!pendingTask) {
        throw new Error("沒有待執行的任務");
      }
      const response = await apiRequest("POST", `/api/tasks/${pendingTask.id}/start`);
      const result = await response.json();
      toast({
        title: "開始數據採集",
        description: "數據採集任務已啟動",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error: any) {
      toast({
        title: "啟動失敗",
        description: error.message || "無法啟動數據採集",
        variant: "destructive",
      });
    }
  };

  const startCollectionMutation = useMutation({
    mutationFn: handleDataCollection,
  });

  const isCollecting = Array.isArray(tasks) ? tasks.some((task: any) => task.status === "running") : false;

  return (
    <>
      <Header
        title="North™Sea 數據採集控制台"
        description="北金國際專業 Facebook 數據收集和監控平台"
        onStartCollection={() => startCollectionMutation.mutate()}
        isCollecting={isCollecting}
      />
      
      <main className="flex-1 overflow-auto p-6">
        {stats && typeof stats === 'object' && 'totalCollected' in stats && <StatsCards stats={stats as any} />}
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2">
            <CollectionPanel />
          </div>
          <div>
            <RealTimeStatus />
          </div>
        </div>
        
        <DataTable />
      </main>
    </>
  );
}
