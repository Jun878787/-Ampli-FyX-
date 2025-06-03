import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Download, Trash2, Search, Target, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const collectionTaskSchema = z.object({
  name: z.string().min(1, "任務名稱為必填"),
  type: z.enum(["posts", "comments", "profiles", "pages", "groups"]),
  targetUrl: z.string().url("請輸入有效的Facebook URL"),
  filters: z.object({
    keywords: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    language: z.enum(["all", "zh", "en", "ja", "ko"]).default("all"),
    region: z.string().optional(),
  }),
  schedule: z.object({
    frequency: z.enum(["once", "hourly", "daily", "weekly"]),
    isActive: z.boolean().default(true),
  }),
});

type CollectionTaskForm = z.infer<typeof collectionTaskSchema>;

export default function DataCollection() {
  const [selectedTab, setSelectedTab] = useState("active-tasks");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const taskForm = useForm<CollectionTaskForm>({
    resolver: zodResolver(collectionTaskSchema),
    defaultValues: {
      name: "",
      type: "posts",
      targetUrl: "",
      filters: {
        keywords: [],
        language: "all",
      },
      schedule: {
        frequency: "daily",
        isActive: true,
      },
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: CollectionTaskForm) => {
      return await apiRequest("/api/tasks", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsCreateDialogOpen(false);
      taskForm.reset();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      return await apiRequest(`/api/tasks/${id}/${action}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/tasks/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const onCreateTask = (data: CollectionTaskForm) => {
    createTaskMutation.mutate(data);
  };

  const toggleTask = (id: number, action: string) => {
    toggleTaskMutation.mutate({ id, action });
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">數據採集</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook數據自動採集系統</p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">活躍任務</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.activeTasks || 0}</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總收集數據</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.totalCollected || 0}</p>
                </div>
                <Download className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">成功率</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.successRate || "0%"}</p>
                </div>
                <Search className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">今日新增</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.todayCollected || 0}</p>
                </div>
                <Plus className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="active-tasks" className="rounded-lg">活躍任務</TabsTrigger>
            <TabsTrigger value="create-task" className="rounded-lg">建立任務</TabsTrigger>
            <TabsTrigger value="templates" className="rounded-lg">採集模板</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg">採集設置</TabsTrigger>
          </TabsList>

          <TabsContent value="active-tasks">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">活躍採集任務</CardTitle>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        新建任務
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl rounded-xl">
                      <DialogHeader>
                        <DialogTitle>建立數據採集任務</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          配置Facebook數據自動採集任務
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...taskForm}>
                        <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={taskForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">任務名稱</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="例：North™Sea 日常貼文收集"
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taskForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">採集類型</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      <SelectItem value="posts">貼文內容</SelectItem>
                                      <SelectItem value="comments">評論互動</SelectItem>
                                      <SelectItem value="profiles">用戶資料</SelectItem>
                                      <SelectItem value="pages">粉絲專頁</SelectItem>
                                      <SelectItem value="groups">群組內容</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={taskForm.control}
                            name="targetUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">目標URL</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="https://facebook.com/..."
                                    className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  />
                                </FormControl>
                                <FormDescription className="text-slate-400">
                                  輸入要採集的Facebook頁面、群組或用戶URL
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={taskForm.control}
                              name="filters.language"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">語言篩選</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      <SelectItem value="all">所有語言</SelectItem>
                                      <SelectItem value="zh">中文</SelectItem>
                                      <SelectItem value="en">英文</SelectItem>
                                      <SelectItem value="ja">日文</SelectItem>
                                      <SelectItem value="ko">韓文</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={taskForm.control}
                              name="schedule.frequency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">執行頻率</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      <SelectItem value="once">執行一次</SelectItem>
                                      <SelectItem value="hourly">每小時</SelectItem>
                                      <SelectItem value="daily">每日</SelectItem>
                                      <SelectItem value="weekly">每週</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateDialogOpen(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                              取消
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTaskMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              {createTaskMutation.isPending ? "建立中..." : "建立任務"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-slate-400 py-8">載入中...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">尚無採集任務</div>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task: any) => (
                      <Card key={task.id} className="bg-slate-700/50 border-slate-600 rounded-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-semibold text-slate-100 text-lg">{task.name}</h3>
                                <Badge
                                  variant={task.status === "running" ? "default" : "secondary"}
                                  className={`rounded-md ${
                                    task.status === "running" 
                                      ? "bg-green-600 text-white" 
                                      : task.status === "paused"
                                      ? "bg-yellow-600 text-white"
                                      : "bg-slate-600 text-slate-300"
                                  }`}
                                >
                                  {task.status === "running" ? "執行中" : task.status === "paused" ? "已暫停" : "已停止"}
                                </Badge>
                                <Badge variant="outline" className="border-slate-600 text-slate-300 rounded-md">
                                  {task.type}
                                </Badge>
                              </div>
                              
                              <div className="mb-4">
                                <p className="text-slate-300 text-sm mb-2">{task.description}</p>
                                {task.progress !== undefined && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-400">
                                      <span>進度</span>
                                      <span>{task.progress}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-2" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-slate-400">
                                <span>已收集: {task.collected || 0}</span>
                                <span>類型: {task.type}</span>
                                <span>建立: {new Date(task.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {task.status === "running" ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => toggleTask(task.id, "pause")}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                                >
                                  <Pause className="h-4 w-4 mr-1" />
                                  暫停
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => toggleTask(task.id, "start")}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  開始
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                設置
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteTask(task.id)}
                                className="border-red-600 text-red-300 hover:bg-red-600 rounded-md"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                刪除
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-task">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">快速建立採集任務</CardTitle>
                <CardDescription className="text-slate-400">
                  使用預設模板快速建立常用的數據採集任務
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/70">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="h-8 w-8 text-blue-400" />
                        <h3 className="font-semibold text-slate-100">粉絲專頁貼文</h3>
                      </div>
                      <p className="text-slate-400 text-sm">自動收集指定粉絲專頁的所有貼文內容</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/70">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-8 w-8 text-green-400" />
                        <h3 className="font-semibold text-slate-100">群組互動</h3>
                      </div>
                      <p className="text-slate-400 text-sm">收集指定群組的貼文和評論互動</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/70">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Search className="h-8 w-8 text-yellow-400" />
                        <h3 className="font-semibold text-slate-100">關鍵字監控</h3>
                      </div>
                      <p className="text-slate-400 text-sm">監控特定關鍵字相關的所有內容</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">採集模板管理</CardTitle>
                <CardDescription className="text-slate-400">
                  管理和配置數據採集模板
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  採集模板功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">採集設置</CardTitle>
                <CardDescription className="text-slate-400">
                  配置全域採集參數和限制
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  採集設置功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
