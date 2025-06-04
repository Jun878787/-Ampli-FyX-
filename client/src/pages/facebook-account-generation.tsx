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
  const [isViewAccountOpen, setIsViewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminPasswordConfig, setAdminPasswordConfig] = useState("NorthSea2024!");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "產號任務創建成功",
        description: "新的批量產號任務已成功創建並開始執行",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: (error) => {
      toast({
        title: "創建任務失敗",
        description: "無法創建產號任務，請檢查配置後重試",
        variant: "destructive",
      });
    },
  });

  // Task control mutations
  const pauseTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "任務已暫停",
        description: "產號任務已成功暫停",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: () => {
      toast({
        title: "暫停失敗",
        description: "無法暫停任務，請稍後重試",
        variant: "destructive",
      });
    },
  });

  const resumeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "任務已恢復",
        description: "產號任務已成功恢復執行",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: () => {
      toast({
        title: "恢復失敗",
        description: "無法恢復任務，請稍後重試",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "任務已刪除",
        description: "產號任務已成功刪除",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "無法刪除任務，請稍後重試",
        variant: "destructive",
      });
    },
  });

  // Verification mutations
  const retryVerificationMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "批量重試成功",
        description: "所有失敗的驗證任務已重新啟動",
      });
    },
    onError: () => {
      toast({
        title: "重試失敗",
        description: "無法啟動批量重試，請稍後再試",
        variant: "destructive",
      });
    },
  });

  // Password verification function
  const verifyAdminPassword = (password: string) => {
    return password === adminPasswordConfig;
  };

  // Account management mutations
  const viewAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const account = generatedAccounts.find((acc: any) => acc.id === accountId);
      if (!account) throw new Error("帳號不存在");
      await new Promise(resolve => setTimeout(resolve, 500));
      return account;
    },
    onSuccess: (account) => {
      setSelectedAccount(account);
      setIsViewAccountOpen(true);
      setIsAdminVerified(false);
      setShowPassword(false);
    },
    onError: () => {
      toast({
        title: "查看失敗",
        description: "無法獲取帳號詳情，請稍後重試",
        variant: "destructive",
      });
    },
  });

  const editAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const account = generatedAccounts.find((acc: any) => acc.id === accountId);
      if (!account) throw new Error("帳號不存在");
      await new Promise(resolve => setTimeout(resolve, 500));
      return account;
    },
    onSuccess: (account) => {
      setSelectedAccount(account);
      setIsEditAccountOpen(true);
      setIsAdminVerified(false);
    },
    onError: () => {
      toast({
        title: "編輯失敗",
        description: "無法打開編輯介面，請稍後重試",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "帳號已刪除",
        description: "選定帳號已成功刪除",
      });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "無法刪除帳號，請稍後重試",
        variant: "destructive",
      });
    },
  });

  const onCreateTask = (data: AccountCreationForm) => {
    createTaskMutation.mutate(data);
  };

  const handleTaskAction = (taskId: number, action: 'pause' | 'resume' | 'delete') => {
    switch (action) {
      case 'pause':
        pauseTaskMutation.mutate(taskId);
        break;
      case 'resume':
        resumeTaskMutation.mutate(taskId);
        break;
      case 'delete':
        deleteTaskMutation.mutate(taskId);
        break;
    }
  };

  const handleAccountAction = (accountId: number, action: 'view' | 'edit' | 'delete') => {
    switch (action) {
      case 'view':
        viewAccountMutation.mutate(accountId);
        break;
      case 'edit':
        editAccountMutation.mutate(accountId);
        break;
      case 'delete':
        deleteAccountMutation.mutate(accountId);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-600 text-white rounded-md">運行中</Badge>;
      case "completed":
        return <Badge className="bg-green-600 text-white rounded-md">已完成</Badge>;
      case "paused":
        return <Badge className="bg-yellow-600 text-white rounded-md">已暫停</Badge>;
      case "failed":
        return <Badge className="bg-red-600 text-white rounded-md">失敗</Badge>;
      default:
        return <Badge className="bg-slate-600 text-white rounded-md">未知</Badge>;
    }
  };

  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-600 text-white rounded-md"><CheckCircle className="w-3 h-3 mr-1" />已驗證</Badge>;
      case "active":
        return <Badge className="bg-blue-600 text-white rounded-md"><Activity className="w-3 h-3 mr-1" />活躍</Badge>;
      case "created":
        return <Badge className="bg-slate-600 text-white rounded-md"><Clock className="w-3 h-3 mr-1" />已創建</Badge>;
      case "failed":
        return <Badge className="bg-red-600 text-white rounded-md"><XCircle className="w-3 h-3 mr-1" />失敗</Badge>;
      case "banned":
        return <Badge className="bg-red-600 text-white rounded-md"><Shield className="w-3 h-3 mr-1" />被封</Badge>;
      default:
        return <Badge className="bg-slate-600 text-white rounded-md">未知</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">批量產號系統</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - 自動化Facebook帳號創建、驗證和管理</p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
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
                        name="profileSettings.useRandomAvatar"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">隨機頭像</FormLabel>
                              <FormDescription className="text-slate-400">自動設置隨機頭像</FormDescription>
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
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">隨機封面</FormLabel>
                              <FormDescription className="text-slate-400">自動設置隨機封面</FormDescription>
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
                            <FormLabel className="text-slate-200">最小年齡</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="18" 
                                max="65"
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
                        control={form.control}
                        name="profileSettings.ageRange.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">最大年齡</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="18" 
                                max="65"
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
                        control={form.control}
                        name="profileSettings.gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">性別設定</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue placeholder="選擇性別" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-700 border-slate-600">
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
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>進度 ({task.completedCount}/{task.targetCount})</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-600/20 border border-green-600/30 rounded-lg">
                      <div className="font-semibold text-green-300">{task.completedCount}</div>
                      <div className="text-green-400">成功</div>
                    </div>
                    <div className="text-center p-2 bg-slate-600/20 border border-slate-600/30 rounded-lg">
                      <div className="font-semibold text-slate-300">{task.targetCount - task.completedCount - task.failedCount}</div>
                      <div className="text-slate-400">待處理</div>
                    </div>
                    <div className="text-center p-2 bg-red-600/20 border border-red-600/30 rounded-lg">
                      <div className="font-semibold text-red-300">{task.failedCount}</div>
                      <div className="text-red-400">失敗</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                      onClick={() => {
                        toast({
                          title: "任務設定",
                          description: "正在打開任務設定面板...",
                        });
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      設定
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                      onClick={() => handleTaskAction(task.id, task.status === "running" ? 'pause' : 'resume')}
                      disabled={pauseTaskMutation.isPending || resumeTaskMutation.isPending}
                    >
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

          <div className="border border-slate-700 rounded-lg bg-slate-800/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-200">帳號名稱</th>
                    <th className="px-4 py-3 text-left text-slate-200">郵箱</th>
                    <th className="px-4 py-3 text-left text-slate-200">狀態</th>
                    <th className="px-4 py-3 text-left text-slate-200">登錄次數</th>
                    <th className="px-4 py-3 text-left text-slate-200">最後登錄</th>
                    <th className="px-4 py-3 text-left text-slate-200">創建時間</th>
                    <th className="px-4 py-3 text-left text-slate-200">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {generatedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium text-slate-100">{account.accountName}</td>
                      <td className="px-4 py-3 text-slate-300">{account.email}</td>
                      <td className="px-4 py-3">{getAccountStatusBadge(account.status)}</td>
                      <td className="px-4 py-3 text-slate-100">{account.loginCount}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {account.lastLogin ? new Date(account.lastLogin).toLocaleString() : "未登錄"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(account.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                            onClick={() => handleAccountAction(account.id, 'view')}
                            disabled={viewAccountMutation.isPending}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                            onClick={() => handleAccountAction(account.id, 'edit')}
                            disabled={editAccountMutation.isPending}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            編輯
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-700 border-red-600 text-red-100 hover:bg-red-600"
                            onClick={() => handleAccountAction(account.id, 'delete')}
                            disabled={deleteAccountMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            刪除
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
            <Button 
              onClick={() => retryVerificationMutation.mutate()}
              disabled={retryVerificationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {retryVerificationMutation.isPending ? "處理中..." : "批量重試驗證"}
            </Button>
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
                    <div className="flex items-center justify-between">
                      <label>管理員密碼</label>
                      <Input 
                        type="password" 
                        value={adminPasswordConfig}
                        onChange={(e) => setAdminPasswordConfig(e.target.value)}
                        className="w-32" 
                        placeholder="設定管理員密碼"
                      />
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

        {/* Account View Dialog */}
        <Dialog open={isViewAccountOpen} onOpenChange={setIsViewAccountOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 text-slate-100 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-400" />
                帳號詳情查看
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                查看選定Facebook帳號的詳細信息和活動記錄
              </DialogDescription>
            </DialogHeader>
            
            {selectedAccount && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">用戶名</label>
                      <div className="font-medium">{selectedAccount.username}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">郵箱</label>
                      <div className="font-medium">{selectedAccount.email}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">Facebook ID</label>
                      <div className="font-medium">{selectedAccount.fbUserId}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">狀態</label>
                      <div className="mt-1">{getAccountStatusBadge(selectedAccount.status)}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">登錄次數</label>
                      <div className="font-medium">{selectedAccount.loginCount}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <label className="text-sm text-slate-400">最後登錄</label>
                      <div className="font-medium">
                        {selectedAccount.lastLogin ? new Date(selectedAccount.lastLogin).toLocaleString() : "未登錄"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-slate-400">帳號密碼</label>
                    {!isAdminVerified ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="password"
                          placeholder="輸入管理員密碼"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-32 h-8 bg-slate-600 border-slate-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (verifyAdminPassword(adminPassword)) {
                              setIsAdminVerified(true);
                              setAdminPassword("");
                              toast({
                                title: "驗證成功",
                                description: "管理員身份已確認，可查看密碼",
                              });
                            } else {
                              toast({
                                title: "密碼錯誤",
                                description: "管理員密碼不正確",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="h-8"
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-8"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPassword ? "隱藏" : "顯示"}
                      </Button>
                    )}
                  </div>
                  <div className="font-mono bg-slate-800 p-2 rounded border">
                    {isAdminVerified && showPassword ? selectedAccount.password : "••••••••••••"}
                  </div>
                </div>

                <div className="p-3 bg-slate-700 rounded-lg">
                  <label className="text-sm text-slate-400 mb-3 block">最近活動記錄</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    <div className="flex justify-between text-sm">
                      <span>登錄成功</span>
                      <span className="text-slate-400">2024-06-04 14:32</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>更新個人資料</span>
                      <span className="text-slate-400">2024-06-04 09:15</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>發布動態</span>
                      <span className="text-slate-400">2024-06-03 21:45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>添加好友</span>
                      <span className="text-slate-400">2024-06-03 16:22</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Account Edit Dialog */}
        <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 text-slate-100 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2 text-green-400" />
                編輯帳號信息
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                修改選定Facebook帳號的基本信息
              </DialogDescription>
            </DialogHeader>
            
            {selectedAccount && (
              <div className="space-y-6">
                {!isAdminVerified ? (
                  <div className="p-4 bg-slate-700 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <Key className="w-5 h-5 text-yellow-400" />
                      <span className="text-slate-300">需要管理員密碼驗證才能編輯帳號</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 mt-3">
                      <Input
                        type="password"
                        placeholder="輸入管理員密碼"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-40 bg-slate-600 border-slate-500"
                      />
                      <Button
                        onClick={() => {
                          if (verifyAdminPassword(adminPassword)) {
                            setIsAdminVerified(true);
                            setAdminPassword("");
                            toast({
                              title: "驗證成功",
                              description: "管理員身份已確認，可編輯帳號",
                            });
                          } else {
                            toast({
                              title: "密碼錯誤",
                              description: "管理員密碼不正確",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        驗證
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">用戶名</label>
                        <Input
                          defaultValue={selectedAccount.username}
                          className="bg-slate-700 border-slate-600"
                          disabled
                        />
                        <span className="text-xs text-slate-500">用戶名無法修改</span>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">郵箱地址</label>
                        <Input
                          type="email"
                          defaultValue={selectedAccount.email}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">新密碼</label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="輸入新密碼（留空表示不修改）"
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">備註名稱</label>
                        <Input
                          placeholder="為此帳號添加備註"
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">標籤</label>
                        <Select>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue placeholder="選擇標籤" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="marketing">營銷帳號</SelectItem>
                            <SelectItem value="testing">測試帳號</SelectItem>
                            <SelectItem value="backup">備用帳號</SelectItem>
                            <SelectItem value="vip">VIP帳號</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditAccountOpen(false);
                          setIsAdminVerified(false);
                        }}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                      >
                        取消
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "更新成功",
                            description: "帳號信息已成功更新",
                          });
                          setIsEditAccountOpen(false);
                          setIsAdminVerified(false);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        保存更改
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}