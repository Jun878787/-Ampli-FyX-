import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Settings, Users, MessageCircle, Power, PowerOff, Trash2, Edit, Play, Pause, BarChart3, Shield, Clock, Target, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const accountSchema = z.object({
  accountName: z.string().min(1, "帳號名稱為必填"),
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少6位"),
  profileName: z.string().min(1, "檔案名稱為必填"),
  status: z.enum(["active", "inactive", "suspended", "warming"]).default("active"),
  useProxy: z.boolean().default(false),
  proxyAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

const nurturingConfigSchema = z.object({
  dailyLikes: z.number().min(1).max(100).default(20),
  dailyComments: z.number().min(0).max(50).default(5),
  dailyShares: z.number().min(0).max(20).default(2),
  dailyFriendRequests: z.number().min(0).max(30).default(10),
  postFrequency: z.number().min(1).max(24).default(6), // hours
  activeHoursStart: z.string().default("09:00"),
  activeHoursEnd: z.string().default("22:00"),
  autoReply: z.boolean().default(true),
  randomDelay: z.boolean().default(true),
});

type AccountForm = z.infer<typeof accountSchema>;
type NurturingConfig = z.infer<typeof nurturingConfigSchema>;

export default function FacebookAccountManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNurturingDialogOpen, setIsNurturingDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/facebook/accounts"],
  });

  const { data: nurturingTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/facebook/nurturing-tasks"],
  });

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      status: "active",
      useProxy: false,
    },
  });

  const nurturingForm = useForm<NurturingConfig>({
    resolver: zodResolver(nurturingConfigSchema),
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountForm) => {
      return await apiRequest("/api/facebook/accounts", { method: "POST", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      setIsCreateDialogOpen(false);
      accountForm.reset();
      toast({
        title: "帳號創建成功",
        description: "Facebook帳號已成功創建並加入管理系統",
      });
    },
    onError: (error: any) => {
      toast({
        title: "創建失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNurturingMutation = useMutation({
    mutationFn: async ({ accountId, config }: { accountId: number; config: NurturingConfig }) => {
      return await apiRequest(`/api/facebook/accounts/${accountId}/nurturing`, { method: "PUT", data: config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/nurturing-tasks"] });
      setIsNurturingDialogOpen(false);
      toast({
        title: "養號配置更新成功",
        description: "帳號養號策略已成功更新",
      });
    },
  });

  const toggleAccountStatusMutation = useMutation({
    mutationFn: async ({ accountId, status }: { accountId: number; status: string }) => {
      return await apiRequest(`/api/facebook/accounts/${accountId}/status`, { method: "PUT", data: { status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      toast({
        title: "狀態更新成功",
        description: "帳號狀態已成功更新",
      });
    },
  });

  const startNurturingMutation = useMutation({
    mutationFn: async (accountIds: number[]) => {
      return await apiRequest("/api/facebook/start-nurturing", { method: "POST", data: { accountIds } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/nurturing-tasks"] });
      toast({
        title: "養號任務啟動",
        description: `已為 ${selectedAccounts.size} 個帳號啟動養號任務`,
      });
    },
  });

  const stopNurturingMutation = useMutation({
    mutationFn: async (accountIds: number[]) => {
      return await apiRequest("/api/facebook/stop-nurturing", { method: "POST", data: { accountIds } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/nurturing-tasks"] });
      toast({
        title: "養號任務停止",
        description: `已停止 ${selectedAccounts.size} 個帳號的養號任務`,
      });
    },
  });

  const handleSelectAccount = (accountId: number) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const handleViewAccount = (account: any) => {
    // 儲存帳號信息到 localStorage 以便詳細頁面使用
    localStorage.setItem('selectedAccountData', JSON.stringify(account));
    setLocation('/my-facebook-account');
  };

  const handleSelectAll = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map(acc => acc.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "活躍", color: "bg-green-600" },
      warming: { variant: "secondary" as const, label: "養號中", color: "bg-yellow-600" },
      inactive: { variant: "outline" as const, label: "未啟用", color: "bg-gray-600" },
      suspended: { variant: "destructive" as const, label: "已封禁", color: "bg-red-600" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Facebook 帳號管理中心</h1>
            <p className="text-gray-300">管理您的Facebook帳號和自動化養號策略</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  添加帳號
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">添加Facebook帳號</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    創建新的Facebook帳號配置
                  </DialogDescription>
                </DialogHeader>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">帳號名稱</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">電子郵件</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">密碼</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="profileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">檔案名稱</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-700 border-gray-600 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="useProxy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-white">使用代理</FormLabel>
                            <div className="text-sm text-gray-400">啟用代理伺服器連接</div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {accountForm.watch("useProxy") && (
                      <FormField
                        control={accountForm.control}
                        name="proxyAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">代理地址</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="127.0.0.1:8080" className="bg-gray-700 border-gray-600 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit" disabled={createAccountMutation.isPending}>
                        {createAccountMutation.isPending ? "創建中..." : "創建帳號"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="accounts" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              帳號列表
            </TabsTrigger>
            <TabsTrigger value="nurturing" className="data-[state=active]:bg-gray-700">
              <Target className="w-4 h-4 mr-2" />
              養號任務
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              數據分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            {/* Batch Operations */}
            {selectedAccounts.size > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-white">已選擇 {selectedAccounts.size} 個帳號</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => startNurturingMutation.mutate(Array.from(selectedAccounts))}
                        disabled={startNurturingMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        開始養號
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => stopNurturingMutation.mutate(Array.from(selectedAccounts))}
                        disabled={stopNurturingMutation.isPending}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        停止養號
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accounts Table */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">帳號列表</CardTitle>
                <CardDescription className="text-gray-400">
                  管理您的Facebook帳號配置和狀態
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">
                        <input
                          type="checkbox"
                          checked={accounts.length > 0 && selectedAccounts.size === accounts.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead className="text-gray-300">帳號名稱</TableHead>
                      <TableHead className="text-gray-300">電子郵件</TableHead>
                      <TableHead className="text-gray-300">狀態</TableHead>
                      <TableHead className="text-gray-300">最後活動</TableHead>
                      <TableHead className="text-gray-300">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          載入中...
                        </TableCell>
                      </TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          暫無帳號，請添加新的Facebook帳號
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((account) => (
                        <TableRow 
                          key={account.id} 
                          className="border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            // 如果點擊的是checkbox或按鈕，不觸發導航
                            if (e.target instanceof HTMLInputElement || 
                                e.target instanceof HTMLButtonElement ||
                                e.target.closest('button')) {
                              return;
                            }
                            handleViewAccount(account);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedAccounts.has(account.id)}
                              onChange={() => handleSelectAccount(account.id)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="text-white font-medium">{account.accountName || account.profileName}</TableCell>
                          <TableCell className="text-gray-300">{account.email}</TableCell>
                          <TableCell>{getStatusBadge(account.status)}</TableCell>
                          <TableCell className="text-gray-300">
                            {account.lastActivity ? new Date(account.lastActivity).toLocaleString('zh-TW') : '從未'}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                title="查看廣告數據"
                                onClick={() => handleViewAccount(account)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="養號設置"
                                onClick={() => {
                                  setSelectedAccount(account);
                                  setIsNurturingDialogOpen(true);
                                }}
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant={account.status === 'active' ? 'outline' : 'default'}
                                title={account.status === 'active' ? '停用帳號' : '啟用帳號'}
                                onClick={() => toggleAccountStatusMutation.mutate({
                                  accountId: account.id,
                                  status: account.status === 'active' ? 'inactive' : 'active'
                                })}
                              >
                                {account.status === 'active' ? 
                                  <PowerOff className="w-3 h-3" /> : 
                                  <Power className="w-3 h-3" />
                                }
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nurturing" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nurturingTasks.map((task) => (
                <Card key={task.id} className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm">{task.accountName}</CardTitle>
                    <div className="flex justify-between items-center">
                      {getStatusBadge(task.status)}
                      <div className="text-xs text-gray-400">
                        {task.progress}% 完成
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-400">今日讚數</div>
                      <div className="text-white">{task.todayLikes}/{task.dailyLikes}</div>
                      <div className="text-gray-400">今日留言</div>
                      <div className="text-white">{task.todayComments}/{task.dailyComments}</div>
                      <div className="text-gray-400">好友請求</div>
                      <div className="text-white">{task.todayFriends}/{task.dailyFriendRequests}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">總帳號數</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{accounts.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">活躍帳號</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {accounts.filter(acc => acc.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">養號中</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    {accounts.filter(acc => acc.status === 'warming').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">封禁帳號</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">
                    {accounts.filter(acc => acc.status === 'suspended').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Nurturing Configuration Dialog */}
        <Dialog open={isNurturingDialogOpen} onOpenChange={setIsNurturingDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">養號配置</DialogTitle>
              <DialogDescription className="text-gray-400">
                為 {selectedAccount?.accountName} 配置自動化養號策略
              </DialogDescription>
            </DialogHeader>
            <Form {...nurturingForm}>
              <form onSubmit={nurturingForm.handleSubmit((data) => 
                selectedAccount && updateNurturingMutation.mutate({ accountId: selectedAccount.id, config: data })
              )} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={nurturingForm.control}
                    name="dailyLikes"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">每日點讚數</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="100"
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : "")}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="dailyComments"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">每日留言數</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="50"
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : "")}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="dailyShares"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">每日分享數</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="20"
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : "")}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="dailyFriendRequests"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-white">每日好友請求數</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="30"
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : "")}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="activeHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">活動開始時間</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" className="bg-gray-700 border-gray-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="activeHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">活動結束時間</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" className="bg-gray-700 border-gray-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <FormField
                    control={nurturingForm.control}
                    name="autoReply"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-white">自動回覆</FormLabel>
                          <div className="text-sm text-gray-400">啟用智能自動回覆功能</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nurturingForm.control}
                    name="randomDelay"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-white">隨機延遲</FormLabel>
                          <div className="text-sm text-gray-400">在操作間添加隨機延遲以模擬人工行為</div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNurturingDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={updateNurturingMutation.isPending}>
                    {updateNurturingMutation.isPending ? "保存中..." : "保存配置"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}