import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Users, Zap, Shield, Activity, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const batchAccountSchema = z.object({
  batchName: z.string().min(1, "批次名稱為必填"),
  accountCount: z.number().min(1).max(50, "帳號數量範圍1-50"),
  namePrefix: z.string().min(1, "名稱前綴為必填"),
  emailDomain: z.string().min(1, "電子郵件域名為必填"),
  accountType: z.enum(["business", "personal", "marketing"]),
  autoNurture: z.boolean().default(true),
});

const nurturingStrategySchema = z.object({
  strategyName: z.string().min(1, "策略名稱為必填"),
  dailyActions: z.number().min(1).max(100),
  friendRequests: z.number().min(0).max(20),
  postLikes: z.number().min(0).max(50),
  comments: z.number().min(0).max(10),
  shares: z.number().min(0).max(5),
  activeHours: z.array(z.number()).min(1, "請選擇至少一個活躍時間"),
});

type BatchAccountForm = z.infer<typeof batchAccountSchema>;
type NurturingStrategyForm = z.infer<typeof nurturingStrategySchema>;

export default function FacebookBatchManagement() {
  const [selectedTab, setSelectedTab] = useState("accounts");
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mock data for demonstration
  const batchAccounts = [
    {
      id: 1,
      batchName: "營銷帳號批次A",
      totalAccounts: 15,
      activeAccounts: 12,
      pendingAccounts: 3,
      failedAccounts: 0,
      createdDate: "2024-06-01",
      status: "running",
      progress: 80,
    },
    {
      id: 2,
      batchName: "企業客戶養號",
      totalAccounts: 10,
      activeAccounts: 8,
      pendingAccounts: 1,
      failedAccounts: 1,
      createdDate: "2024-05-28",
      status: "completed",
      progress: 100,
    },
    {
      id: 3,
      batchName: "地區推廣帳號",
      totalAccounts: 20,
      activeAccounts: 5,
      pendingAccounts: 12,
      failedAccounts: 3,
      createdDate: "2024-06-03",
      status: "creating",
      progress: 25,
    },
  ];

  const nurturingStrategies = [
    {
      id: 1,
      strategyName: "保守型養號",
      dailyActions: 30,
      friendRequests: 3,
      postLikes: 15,
      comments: 2,
      shares: 1,
      activeHours: [9, 12, 15, 18, 21],
      status: "active",
    },
    {
      id: 2,
      strategyName: "積極型推廣",
      dailyActions: 80,
      friendRequests: 10,
      postLikes: 40,
      comments: 8,
      shares: 3,
      activeHours: [8, 10, 12, 14, 16, 18, 20, 22],
      status: "active",
    },
  ];

  const batchForm = useForm<BatchAccountForm>({
    resolver: zodResolver(batchAccountSchema),
    defaultValues: {
      batchName: "",
      accountCount: 10,
      namePrefix: "NorthSea",
      emailDomain: "tempmail.org",
      accountType: "marketing",
      autoNurture: true,
    },
  });

  const strategyForm = useForm<NurturingStrategyForm>({
    resolver: zodResolver(nurturingStrategySchema),
    defaultValues: {
      strategyName: "",
      dailyActions: 50,
      friendRequests: 5,
      postLikes: 25,
      comments: 5,
      shares: 2,
      activeHours: [9, 12, 15, 18],
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: BatchAccountForm) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await apiRequest("/api/facebook/batch-accounts", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "批次帳號創建成功",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      setIsBatchDialogOpen(false);
      batchForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/batch-accounts"] });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "創建批次失敗，請重試",
        variant: "destructive",
      });
    },
  });

  const createStrategyMutation = useMutation({
    mutationFn: async (data: NurturingStrategyForm) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await apiRequest("/api/facebook/nurturing-strategies", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "養號策略創建成功",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      setIsStrategyDialogOpen(false);
      strategyForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/nurturing-strategies"] });
    },
    onError: () => {
      toast({
        title: "錯誤",
        description: "創建策略失敗，請重試",
        variant: "destructive",
      });
    },
  });

  const onCreateBatch = (data: BatchAccountForm) => {
    createBatchMutation.mutate(data);
  };

  const onCreateStrategy = (data: NurturingStrategyForm) => {
    createStrategyMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-600 text-slate-100 rounded-lg">運行中</Badge>;
      case "completed":
        return <Badge className="bg-green-600 text-slate-100 rounded-lg">已完成</Badge>;
      case "creating":
        return <Badge className="bg-yellow-600 text-slate-100 rounded-lg">創建中</Badge>;
      case "paused":
        return <Badge className="bg-slate-600 text-slate-100 rounded-lg">已暫停</Badge>;
      case "active":
        return <Badge className="bg-green-600 text-slate-100 rounded-lg">活躍</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300 rounded-lg">未知</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Facebook 批次養號管理</h1>
          <p className="text-slate-400">自動化帳號創建、養號策略和批量操作管理</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 rounded-lg">
            <TabsTrigger value="accounts" className="rounded-lg">批量帳號</TabsTrigger>
            <TabsTrigger value="nurturing" className="rounded-lg">養號策略</TabsTrigger>
            <TabsTrigger value="automation" className="rounded-lg">自動化</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">數據分析</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-100">帳號批次管理</h2>
              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    創建新批次
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">創建帳號批次</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      批量創建Facebook帳號，支持自動養號和管理
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...batchForm}>
                    <form onSubmit={batchForm.handleSubmit(onCreateBatch)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={batchForm.control}
                          name="batchName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">批次名稱</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="例如：營銷帳號批次A" 
                                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={batchForm.control}
                          name="accountCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">帳號數量</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="50"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={batchForm.control}
                          name="namePrefix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">名稱前綴</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="NorthSea" 
                                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={batchForm.control}
                          name="emailDomain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">郵箱域名</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="tempmail.org" 
                                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={batchForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">帳號類型</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue placeholder="選擇帳號類型" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-700 border-slate-600 text-slate-100">
                                <SelectItem value="business">商業帳號</SelectItem>
                                <SelectItem value="personal">個人帳號</SelectItem>
                                <SelectItem value="marketing">營銷帳號</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={batchForm.control}
                        name="autoNurture"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">自動養號</FormLabel>
                              <FormDescription className="text-slate-400">
                                啟用自動養號策略
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBatchDialogOpen(false)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-lg"
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          disabled={createBatchMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          {createBatchMutation.isPending ? "創建中..." : "創建批次"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchAccounts.map((batch) => (
                <Card key={batch.id} className="bg-slate-800/50 border-slate-700 hover:shadow-lg transition-shadow rounded-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-slate-100">{batch.batchName}</CardTitle>
                        <CardDescription className="text-slate-400">
                          創建時間：{new Date(batch.createdDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(batch.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">進度</span>
                        <span className="text-slate-300">{batch.activeAccounts} / {batch.totalAccounts}</span>
                      </div>
                      <Progress 
                        value={batch.progress} 
                        className="h-2 bg-slate-700"
                      />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">活躍：</span>
                          <span className="text-green-400">{batch.activeAccounts}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">待處理：</span>
                          <span className="text-yellow-400">{batch.pendingAccounts}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">總數：</span>
                          <span className="text-slate-300">{batch.totalAccounts}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">失敗：</span>
                          <span className="text-red-400">{batch.failedAccounts}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            <Edit className="h-4 w-4 mr-1" />
                            編輯
                          </Button>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900 rounded-md">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nurturing" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-100">養號策略管理</h2>
              <Dialog open={isStrategyDialogOpen} onOpenChange={setIsStrategyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    創建新策略
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">創建養號策略</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      設定自動化養號行為和參數
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...strategyForm}>
                    <form onSubmit={strategyForm.handleSubmit(onCreateStrategy)} className="space-y-4">
                      <FormField
                        control={strategyForm.control}
                        name="strategyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">策略名稱</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="例如：保守型養號策略" 
                                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 rounded-lg"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={strategyForm.control}
                          name="dailyActions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">每日動作數</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="100"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={strategyForm.control}
                          name="friendRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">好友請求數</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="20"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={strategyForm.control}
                          name="postLikes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">貼文點讚</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="50"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={strategyForm.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">評論數</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="10"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={strategyForm.control}
                          name="shares"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-200">分享數</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="5"
                                  className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsStrategyDialogOpen(false)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-lg"
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          disabled={createStrategyMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          {createStrategyMutation.isPending ? "創建中..." : "創建策略"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nurturingStrategies.map((strategy) => (
                <Card key={strategy.id} className="bg-slate-800/50 border-slate-700 hover:shadow-lg transition-shadow rounded-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-slate-100">{strategy.strategyName}</CardTitle>
                        <CardDescription className="text-slate-400">
                          每日{strategy.dailyActions}個動作
                        </CardDescription>
                      </div>
                      {getStatusBadge(strategy.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">好友請求：</span>
                          <span className="text-slate-300">{strategy.friendRequests}/天</span>
                        </div>
                        <div>
                          <span className="text-slate-400">貼文點讚：</span>
                          <span className="text-slate-300">{strategy.postLikes}/天</span>
                        </div>
                        <div>
                          <span className="text-slate-400">評論：</span>
                          <span className="text-slate-300">{strategy.comments}/天</span>
                        </div>
                        <div>
                          <span className="text-slate-400">分享：</span>
                          <span className="text-slate-300">{strategy.shares}/天</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">活躍時間：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {strategy.activeHours.map((hour) => (
                            <Badge key={hour} variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            <Edit className="h-4 w-4 mr-1" />
                            編輯
                          </Button>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900 rounded-md">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">自動化設定</h3>
              <p className="text-slate-400">配置自動化流程和腳本執行</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">數據分析</h3>
              <p className="text-slate-400">查看批次帳號表現和養號效果統計</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}