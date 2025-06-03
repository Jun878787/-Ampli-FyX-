import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useFacebookData() {
  const queryClient = useQueryClient();

  const useStats = () => {
    return useQuery({
      queryKey: ["/api/stats"],
      refetchInterval: 5000,
    });
  };

  const useTasks = () => {
    return useQuery({
      queryKey: ["/api/tasks"],
      refetchInterval: 3000,
    });
  };

  const useCollectedData = (limit = 10, offset = 0, search?: string) => {
    return useQuery({
      queryKey: ["/api/data", { limit, offset, search }],
      refetchInterval: 10000,
    });
  };

  const createTask = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const startTask = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const stopTask = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteData = useMutation({
    mutationFn: async (dataId: number) => {
      await apiRequest("DELETE", `/api/data/${dataId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data"] });
    },
  });

  const exportData = useMutation({
    mutationFn: async ({ ids, format }: { ids: number[]; format: string }) => {
      const response = await apiRequest("POST", "/api/export", { ids, format });
      return response.json();
    },
  });

  return {
    useStats,
    useTasks,
    useCollectedData,
    createTask,
    startTask,
    stopTask,
    deleteData,
    exportData,
  };
}
