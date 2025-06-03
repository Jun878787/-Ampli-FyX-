import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Settings, Users, Zap, Shield, Activity, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react";
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

const accountCreationSchema = z.object({
  taskName: z.string().min(1, "任務名稱為必填"),
  targetCount: z.number().min(1).max(100, "帳號數量範圍1-100"),
  nameTemplate: z.string().min(1, "名稱模板為必填"),
  emailTemplate: z.string().min(1, "郵箱模板為必填"),
  passwordTemplate: z.string().min(1, "密碼模板為必填"),
  profileSettings: z.object({
    useRandomAvatar: z.boolean().default(true),
    useRandomCover: z.boolean().default(true),
    randomBio: z.boolean().default(true),
    ageRange: z.object({
      min: z.number().min(18).max(65),
      max: z.number().min(18).max(65),
    }),
    gender: z.enum(["random", "male", "female"]).default("random"),
  }),
  verificationSettings: z.object({
    enableEmailVerification: z.boolean().default(true),
    enablePhoneVerification: z.boolean().default(false),
    autoVerify: z.boolean().default(true),
  }),
  proxySettings: z.object({
    useProxy: z.boolean().default(true),
    proxyType: z.enum(["http", "socks5"]).default("http"),
    rotateProxy: z.boolean().default(true),
  }),
});

type AccountCreationForm = z.infer<typeof accountCreationSchema>;

export default function FacebookAccountGeneration() {
  const [selectedTab, setSelectedTab] = useState("tasks");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: creationTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/facebook/generation-tasks"],
  });

  const generatedAccounts = [
    {
      id: 1,
      taskId: 1,
      accountName: "NorthSea_Marketing_001",
      email: "ns.marketing.001@tempmail.org",
      status: "verified",
      fbUserId: "fb_123456789",
      loginCount: 5,
      lastLogin: "2024-06-03T18:30:00",
      createdAt: "2024-06-03T09:15:00",
    },
    {
      id: 2,
      taskId: 1,
      accountName: "NorthSea_Marketing_002",
      email: "ns.marketing.002@tempmail.org",
      status: "active",
      fbUserId: "fb_123456790",
      loginCount: 12,
      lastLogin: "2024-06-03T19:45:00",
      createdAt: "2024-06-03T09:18:00",
    },
    {
      id: 3,
      taskId: 1,
      accountName: "NorthSea_Marketing_003",
      email: "ns.marketing.003@tempmail.org",
      status: "created",
      fbUserId: null,
      loginCount: 0,
      lastLogin: null,
      createdAt: "2024-06-03T09:20:00",
    },
    {
      id: 4,
      taskId: 2,
      accountName: "NorthSea_Business_001",
      email: "ns.business.001@tempmail.org",
      status: "active",
      fbUserId: "fb_123456791",
      loginCount: 25,
      lastLogin: "2024-06-03T20:00:00",
      createdAt: "2024-06-02T14:35:00",
    },
  ];

  const verificationTasks = [
    {
      id: 1,
      accountId: 1,
      verificationType: "email",
      status: "completed",
      attempts: 1,
      completedAt: "2024-06-03T09:17:00",
    },
    {
      id: 2,
      accountId: 2,
      verificationType: "email",
      status: "completed",
      attempts: 1,
      completedAt: "2024-06-03T09:20:00",
    },
    {
      id: 3,
      accountId: 3,
      verificationType: "email",
      status: "pending",
      attempts: 0,
      completedAt: null,
    },
  ];

  const form = useForm<AccountCreationForm>({
    resolver: zodResolver(accountCreationSchema),
    defaultValues: {
      taskName: "",
      targetCount: 10,
      nameTemplate: "NorthSea_{random}",
      emailTemplate: "ns.{name}@tempmail.org",
      passwordTemplate: "NS{random}!",
      profileSettings: {
        useRandomAvatar: true,
        useRandomCover: true,
        randomBio: true,
        ageRange: { min: 25, max: 45 },
        gender: "random",
      },
      verificationSettings: {
        enableEmailVerification: true,
        enablePhoneVerification: false,
        autoVerify: true,
      },
      proxySettings: {
        useProxy: true,
        proxyType: "http",
        rotateProxy: true,
      },
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: AccountCreationForm) => {
      // Simulate account creation task
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const onCreateTask = (data: AccountCreationForm) => {
    createTaskMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">運行中</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">已暫停</Badge>;
      case "failed":
        return <Badge variant="destructive">失敗</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />已驗證</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800"><Activity className="w-3 h-3 mr-1" />活躍</Badge>;
      case "created":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />已創建</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />失敗</Badge>;
      case "banned":
        return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />被封</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">批量產號系統</h1>
          <p className="text-gray-600 mt-2">自動化Facebook帳號創建、驗證和管理</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">產號任務</TabsTrigger>
          <TabsTrigger value="accounts">生成帳號</TabsTrigger>
          <TabsTrigger value="verification">驗證管理</TabsTrigger>
          <TabsTrigger value="settings">系統設定</TabsTrigger>
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
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>創建批量產號任務</DialogTitle>
                  <DialogDescription>
                    配置自動化Facebook帳號創建參數和設定
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateTask)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="taskName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>任務名稱</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：北金國際營銷帳號批次" {...field} />
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
                            <FormLabel>目標帳號數</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100"
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
                            <FormLabel>名稱模板</FormLabel>
                            <FormControl>
                              <Input placeholder="NorthSea_{random}" {...field} />
                            </FormControl>
                            <FormDescription>
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
                            <FormLabel>郵箱模板</FormLabel>
                            <FormControl>
                              <Input placeholder="ns.{name}@tempmail.org" {...field} />
                            </FormControl>
                            <FormDescription>
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
                            <FormLabel>密碼模板</FormLabel>
                            <FormControl>
                              <Input placeholder="NS{random}!" {...field} />
                            </FormControl>
                            <FormDescription>
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
                        name="profileSettings.useRandomAvatar"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>隨機頭像</FormLabel>
                              <FormDescription>自動設置隨機頭像</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="profileSettings.useRandomCover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>隨機封面</FormLabel>
                              <FormDescription>自動設置隨機封面</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="profileSettings.ageRange.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>最小年齡</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="18" 
                                max="65"
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
                        name="profileSettings.ageRange.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>最大年齡</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="18" 
                                max="65"
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
                        name="profileSettings.gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>性別設定</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="選擇性別" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="random">隨機</SelectItem>
                                <SelectItem value="male">男性</SelectItem>
                                <SelectItem value="female">女性</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />
                    <h3 className="text-lg font-semibold">驗證設定</h3>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="verificationSettings.enableEmailVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>郵箱驗證</FormLabel>
                              <FormDescription>自動進行郵箱驗證</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="verificationSettings.autoVerify"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>自動驗證</FormLabel>
                              <FormDescription>創建後立即進行驗證</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />
                    <h3 className="text-lg font-semibold">代理設定</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="proxySettings.useProxy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>使用代理</FormLabel>
                              <FormDescription>通過代理創建帳號</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proxySettings.rotateProxy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>代理輪換</FormLabel>
                              <FormDescription>自動輪換代理IP</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{task.taskName}</CardTitle>
                      <CardDescription>
                        創建時間：{new Date(task.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>進度 ({task.completedCount}/{task.targetCount})</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-700">{task.completedCount}</div>
                      <div className="text-green-600">成功</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-gray-700">{task.targetCount - task.completedCount - task.failedCount}</div>
                      <div className="text-gray-600">待處理</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-semibold text-red-700">{task.failedCount}</div>
                      <div className="text-red-600">失敗</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      設定
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      {task.status === "running" ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                      {task.status === "running" ? "暫停" : "開始"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">生成帳號列表</h2>
            <div className="flex space-x-2">
              <Button variant="outline">匯出帳號</Button>
              <Button variant="outline">批量操作</Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">帳號名稱</th>
                    <th className="px-4 py-3 text-left">郵箱</th>
                    <th className="px-4 py-3 text-left">狀態</th>
                    <th className="px-4 py-3 text-left">登錄次數</th>
                    <th className="px-4 py-3 text-left">最後登錄</th>
                    <th className="px-4 py-3 text-left">創建時間</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {generatedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{account.accountName}</td>
                      <td className="px-4 py-3 text-gray-600">{account.email}</td>
                      <td className="px-4 py-3">{getAccountStatusBadge(account.status)}</td>
                      <td className="px-4 py-3">{account.loginCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {account.lastLogin ? new Date(account.lastLogin).toLocaleString() : "未登錄"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(account.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            查看
                          </Button>
                          <Button variant="outline" size="sm">
                            編輯
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">驗證任務管理</h2>
            <Button>批量重試驗證</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">待驗證</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">驗證成功</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">驗證失敗</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系統設定</CardTitle>
              <CardDescription>配置產號系統的全局參數</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-blue-500" />
                      基本設定
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label>並發創建數量</label>
                      <Input type="number" defaultValue="5" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>創建間隔（秒）</label>
                      <Input type="number" defaultValue="10" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>失敗重試次數</label>
                      <Input type="number" defaultValue="3" className="w-20" />
                    </div>
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
                      <label>啟用驗證碼識別</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>使用人機驗證</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>啟用風控檢測</label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}