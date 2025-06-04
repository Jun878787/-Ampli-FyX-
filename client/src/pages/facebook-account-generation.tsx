import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Users, Zap, Shield, Activity, UserPlus, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, EyeOff, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const accountCreationSchema = z.object({
  taskName: z.string().min(1, "任務名稱為必填"),
  targetCount: z.number().min(1).max(100, "帳號數量範圍1-100"),
  nameTemplate: z.string().min(1, "名稱模板為必填"),
  emailTemplate: z.string().min(1, "郵箱模板為必填"),
  passwordTemplate: z.string().min(1, "密碼模板為必填"),
  randomAvatar: z.boolean().default(true),
  randomCover: z.boolean().default(true),
  minAge: z.number().min(18).max(65),
  maxAge: z.number().min(18).max(65),
}).refine((data) => data.minAge <= data.maxAge, {
  message: "最小年齡不能大於最大年齡",
  path: ["maxAge"],
});

type AccountCreationForm = z.infer<typeof accountCreationSchema>;

export default function FacebookAccountGeneration() {
  const [selectedTab, setSelectedTab] = useState("tasks");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: creationTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/facebook/generation-tasks"],
  });

  const form = useForm<AccountCreationForm>({
    resolver: zodResolver(accountCreationSchema),
    defaultValues: {
      taskName: "",
      targetCount: 10,
      nameTemplate: "NorthSea_{random}",
      emailTemplate: "ns.{name}@tempmail.org",
      passwordTemplate: "NS{random}!",
      randomAvatar: true,
      randomCover: true,
      minAge: 25,
      maxAge: 45,
    },
  });

  const editForm = useForm<AccountCreationForm>({
    resolver: zodResolver(accountCreationSchema),
    defaultValues: {
      taskName: "",
      targetCount: 10,
      nameTemplate: "",
      emailTemplate: "",
      passwordTemplate: "",
      randomAvatar: true,
      randomCover: true,
      minAge: 18,
      maxAge: 65,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: AccountCreationForm) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await apiRequest("/api/facebook/generation-tasks", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "產號任務創建成功",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "創建任務失敗，請重試",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AccountCreationForm }) => {
      return await apiRequest(`/api/facebook/generation-tasks/${id}`, {
        method: "PUT",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任務設定已更新",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      setIsEditTaskOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "更新任務失敗，請重試",
        variant: "destructive",
      });
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/facebook/generation-tasks/${taskId}/start`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任務已開始執行",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
  });

  const pauseTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/facebook/generation-tasks/${taskId}/pause`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任務已暫停",
        className: "bg-yellow-800 border-yellow-700 text-yellow-100",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/facebook/generation-tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "任務已刪除",
        className: "bg-red-800 border-red-700 text-red-100",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
  });

  const onCreateTask = (data: AccountCreationForm) => {
    createTaskMutation.mutate(data);
  };

  const onUpdateTask = (data: AccountCreationForm) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data });
    }
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setIsViewTaskOpen(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    editForm.reset({
      taskName: task.taskName,
      targetCount: task.targetCount,
      nameTemplate: task.nameTemplate,
      emailTemplate: task.emailTemplate,
      passwordTemplate: task.passwordTemplate,
      randomAvatar: task.randomAvatar,
      randomCover: task.randomCover,
      minAge: task.minAge,
      maxAge: task.maxAge,
    });
    setIsEditTaskOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "待執行", color: "bg-slate-600" },
      running: { label: "執行中", color: "bg-blue-600" },
      completed: { label: "已完成", color: "bg-green-600" },
      paused: { label: "已暫停", color: "bg-yellow-600" },
      failed: { label: "失敗", color: "bg-red-600" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={`${config.color} text-white rounded-lg`}>{config.label}</Badge>;
  };

  const getActionButton = (task: any) => {
    const isRunning = task.status === "running";
    const isPending = task.status === "pending";
    const isCompleted = task.status === "completed";
    const isPaused = task.status === "paused";

    if (isRunning) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewTask(task)}
            className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
          >
            <Eye className="h-4 w-4 mr-1" />
            查看
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => pauseTaskMutation.mutate(task.id)}
            className="border-yellow-600 text-yellow-400 hover:bg-yellow-900 rounded-md"
          >
            <Pause className="h-4 w-4 mr-1" />
            暫停
          </Button>
        </div>
      );
    }

    if (isPending || isPaused) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditTask(task)}
            className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
          >
            <Edit className="h-4 w-4 mr-1" />
            編輯
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => startTaskMutation.mutate(task.id)}
            className="border-green-600 text-green-400 hover:bg-green-900 rounded-md"
          >
            <Play className="h-4 w-4 mr-1" />
            開始
          </Button>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewTask(task)}
          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
        >
          <Eye className="h-4 w-4 mr-1" />
          查看
        </Button>
      );
    }

    return null;
  };

  const TaskFormFields = ({ form, readOnly = false }: { form: any; readOnly?: boolean }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taskName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">任務名稱</FormLabel>
              <FormControl>
                <Input 
                  placeholder="例如：北金國際營銷帳號批次" 
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                  readOnly={readOnly}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="targetCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">目標帳號數</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="100"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                  readOnly={readOnly}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-lg font-semibold">帳號模板設定</h3>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="nameTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">名稱模板</FormLabel>
              <FormControl>
                <Input 
                  placeholder="NorthSea_{random}" 
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                  readOnly={readOnly}
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                使用 {"{random}"} 生成隨機字符，{"{number}"} 生成序號
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="emailTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">郵箱模板</FormLabel>
              <FormControl>
                <Input 
                  placeholder="ns.{name}@tempmail.org" 
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                  readOnly={readOnly}
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                使用 {"{name}"} 引用生成的名稱
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passwordTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">密碼模板</FormLabel>
              <FormControl>
                <Input 
                  placeholder="NS{random}!" 
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                  readOnly={readOnly}
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-slate-400">
                建議包含數字、字母和特殊字符
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />
      <h3 className="text-lg font-semibold">個人資料設定</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="randomAvatar"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-slate-200">隨機頭像</FormLabel>
                <FormDescription className="text-slate-400">自動設置隨機頭像</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="randomCover"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-slate-200">隨機封面</FormLabel>
                <FormDescription className="text-slate-400">自動設置隨機封面</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="minAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">最小年齡</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="18" 
                  max="65"
                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                  readOnly={readOnly}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">最大年齡</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="18" 
                  max="65"
                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                  readOnly={readOnly}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Facebook 帳號生成</h1>
          <p className="text-slate-400">批量創建和管理Facebook帳號，支持自動化設定和驗證</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 rounded-lg">
            <TabsTrigger value="tasks" className="rounded-lg">產號任務</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-lg">生成帳號</TabsTrigger>
            <TabsTrigger value="verification" className="rounded-lg">驗證管理</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg">系統設定</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">產號任務管理</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    創建產號任務
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">創建批量產號任務</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      配置自動化Facebook帳號創建參數和設定
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateTask)} className="space-y-6">
                      <TaskFormFields form={form} />
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          disabled={createTaskMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createTaskMutation.isPending ? "創建中..." : "創建任務"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creationTasks.map((task) => (
                <Card key={task.id} className="bg-slate-800/50 border-slate-700 hover:shadow-lg transition-shadow rounded-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-slate-100">{task.taskName}</CardTitle>
                        <CardDescription className="text-slate-400">
                          創建時間：{new Date(task.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">進度</span>
                        <span className="text-slate-300">{task.completedCount || 0} / {task.targetCount}</span>
                      </div>
                      <Progress 
                        value={(task.completedCount || 0) / task.targetCount * 100} 
                        className="h-2 bg-slate-700"
                      />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">目標數量：</span>
                          <span className="text-slate-300">{task.targetCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">已完成：</span>
                          <span className="text-slate-300">{task.completedCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        {getActionButton(task)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">生成帳號管理</h3>
              <p className="text-slate-400">查看和管理已生成的Facebook帳號</p>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">驗證管理</h3>
              <p className="text-slate-400">管理帳號驗證狀態和流程</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">系統設定</h3>
              <p className="text-slate-400">配置系統參數和API設定</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 查看任務對話框 */}
      <Dialog open={isViewTaskOpen} onOpenChange={setIsViewTaskOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">查看任務設定</DialogTitle>
            <DialogDescription className="text-slate-400">
              查看任務的詳細設定和參數（只讀模式）
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-200 text-sm font-medium">任務名稱</label>
                  <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                    {selectedTask.taskName}
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-200 text-sm font-medium">目標帳號數</label>
                  <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                    {selectedTask.targetCount}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">帳號模板設定</h3>
                
                <div>
                  <label className="text-slate-200 text-sm font-medium">名稱模板</label>
                  <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                    {selectedTask.nameTemplate || "NorthSea_{random}"}
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-200 text-sm font-medium">郵箱模板</label>
                  <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                    {selectedTask.emailTemplate || "ns.{name}@tempmail.org"}
                  </div>
                </div>

                <div>
                  <label className="text-slate-200 text-sm font-medium">密碼模板</label>
                  <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                    {selectedTask.passwordTemplate || "NS{random}!"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">個人資料設定</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-lg">
                    <span className="text-slate-200">隨機頭像</span>
                    <span className="text-slate-300">
                      {selectedTask.randomAvatar !== false ? "已啟用" : "已停用"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-lg">
                    <span className="text-slate-200">隨機封面</span>
                    <span className="text-slate-300">
                      {selectedTask.randomCover !== false ? "已啟用" : "已停用"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-200 text-sm font-medium">最小年齡</label>
                    <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                      {selectedTask.minAge || 25}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-200 text-sm font-medium">最大年齡</label>
                    <div className="mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100">
                      {selectedTask.maxAge || 45}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewTaskOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-lg"
                >
                  關閉
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編輯任務對話框 */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">編輯任務設定</DialogTitle>
            <DialogDescription className="text-slate-400">
              修改任務的設定和參數
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateTask)} className="space-y-6">
              <TaskFormFields form={editForm} />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTaskOpen(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={updateTaskMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateTaskMutation.isPending ? "更新中..." : "更新任務"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}