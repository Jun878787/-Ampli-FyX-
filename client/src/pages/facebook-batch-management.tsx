import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Users, Zap, Shield, Activity } from "lucide-react";
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
      pendingAccounts: 15,
      failedAccounts: 0,
      createdDate: "2024-06-03",
      status: "creating",
      progress: 25,
    },
  ];

  const nurturingStrategies = [
    {
      id: 1,
      name: "溫和養號策略",
      dailyActions: 15,
      friendRequests: 3,
      postLikes: 8,
      comments: 2,
      shares: 1,
      activeAccounts: 25,
      successRate: "92%",
    },
    {
      id: 2,
      name: "積極推廣策略",
      dailyActions: 35,
      friendRequests: 8,
      postLikes: 20,
      comments: 5,
      shares: 2,
      activeAccounts: 12,
      successRate: "87%",
    },
    {
      id: 3,
      name: "企業專用策略",
      dailyActions: 25,
      friendRequests: 5,
      postLikes: 15,
      comments: 3,
      shares: 2,
      activeAccounts: 18,
      successRate: "94%",
    },
  ];

  const batchForm = useForm<BatchAccountForm>({
    resolver: zodResolver(batchAccountSchema),
    defaultValues: {
      batchName: "",
      accountCount: 10,
      namePrefix: "NorthSea",
      emailDomain: "tempmail.com",
      accountType: "business",
      autoNurture: true,
    },
  });

  const strategyForm = useForm<NurturingStrategyForm>({
    resolver: zodResolver(nurturingStrategySchema),
    defaultValues: {
      strategyName: "",
      dailyActions: 20,
      friendRequests: 5,
      postLikes: 10,
      comments: 3,
      shares: 1,
      activeHours: [9, 14, 19],
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: BatchAccountForm) => {
      // Simulate batch account creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      setIsBatchDialogOpen(false);
      batchForm.reset();
    },
  });

  const createStrategyMutation = useMutation({
    mutationFn: async (data: NurturingStrategyForm) => {
      // Simulate strategy creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsStrategyDialogOpen(false);
      strategyForm.reset();
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
        return <Badge className="bg-blue-100 text-blue-800">運行中</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case "creating":
        return <Badge className="bg-yellow-100 text-yellow-800">創建中</Badge>;
      case "paused":
        return <Badge variant="secondary">已暫停</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">批量帳號管理</h1>
          <p className="text-gray-600 mt-2">自動化Facebook帳號創建、養號和批量操作</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">批量帳號</TabsTrigger>
          <TabsTrigger value="nurturing">養號策略</TabsTrigger>
          <TabsTrigger value="automation">自動化</TabsTrigger>
          <TabsTrigger value="analytics">數據分析</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">帳號批次管理</h2>
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  創建新批次
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>創建帳號批次</DialogTitle>
                  <DialogDescription>
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
                            <FormLabel>批次名稱</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：營銷帳號批次A" {...field} />
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
                            <FormLabel>帳號數量</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="50"
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
                            <FormLabel>名稱前綴</FormLabel>
                            <FormControl>
                              <Input placeholder="NorthSea" {...field} />
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
                            <FormLabel>電子郵件域名</FormLabel>
                            <FormControl>
                              <Input placeholder="tempmail.com" {...field} />
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
                          <FormLabel>帳號類型</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇帳號類型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">自動養號</FormLabel>
                            <FormDescription>
                              創建後自動啟動養號策略
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBatchDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        disabled={createBatchMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
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
              <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{batch.batchName}</CardTitle>
                      <CardDescription>
                        創建日期：{batch.createdDate}
                      </CardDescription>
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>進度</span>
                      <span>{batch.progress}%</span>
                    </div>
                    <Progress value={batch.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-700">{batch.activeAccounts}</div>
                      <div className="text-green-600">活躍</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-semibold text-yellow-700">{batch.pendingAccounts}</div>
                      <div className="text-yellow-600">待處理</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      設定
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Activity className="w-4 h-4 mr-1" />
                      監控
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nurturing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">養號策略管理</h2>
            <Dialog open={isStrategyDialogOpen} onOpenChange={setIsStrategyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新增策略
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>創建養號策略</DialogTitle>
                  <DialogDescription>
                    設定自動化養號行為和時間安排
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...strategyForm}>
                  <form onSubmit={strategyForm.handleSubmit(onCreateStrategy)} className="space-y-4">
                    <FormField
                      control={strategyForm.control}
                      name="strategyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>策略名稱</FormLabel>
                          <FormControl>
                            <Input placeholder="例如：溫和養號策略" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={strategyForm.control}
                        name="dailyActions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>每日總操作</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
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
                            <FormLabel>好友請求</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
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
                        name="postLikes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>按讚數量</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
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
                        control={strategyForm.control}
                        name="comments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>評論數量</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
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
                            <FormLabel>分享數量</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
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
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        disabled={createStrategyMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createStrategyMutation.isPending ? "創建中..." : "創建策略"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nurturingStrategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription>
                    成功率：{strategy.successRate} | 使用帳號：{strategy.activeAccounts}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>每日操作</span>
                        <span className="font-semibold">{strategy.dailyActions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>好友請求</span>
                        <span className="font-semibold">{strategy.friendRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>按讚</span>
                        <span className="font-semibold">{strategy.postLikes}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>評論</span>
                        <span className="font-semibold">{strategy.comments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>分享</span>
                        <span className="font-semibold">{strategy.shares}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      編輯
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-1" />
                      啟用
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>自動化設定</CardTitle>
              <CardDescription>配置批量操作和自動化任務</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                      批量操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" variant="outline">
                      批量加好友
                    </Button>
                    <Button className="w-full" variant="outline">
                      批量發送訊息
                    </Button>
                    <Button className="w-full" variant="outline">
                      批量按讚貼文
                    </Button>
                    <Button className="w-full" variant="outline">
                      批量加入群組
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-500" />
                      安全設定
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label>隨機延遲</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>代理輪換</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>行為模擬</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>風控檢測</label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總帳號數</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">活躍帳號</p>
                    <p className="text-2xl font-bold">38</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">今日操作</p>
                    <p className="text-2xl font-bold">1,248</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">成功率</p>
                    <p className="text-2xl font-bold">91.2%</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}