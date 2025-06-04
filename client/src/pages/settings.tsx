import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Settings as SettingsIcon, Database, Shield, Bell, Globe, User, Save, Key, RefreshCw, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "公司名稱為必填"),
  language: z.enum(["zh-TW", "zh-CN", "en", "ja", "ko"]).default("zh-TW"),
  timezone: z.string().default("Asia/Taipei"),
  dateFormat: z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"]).default("YYYY-MM-DD"),
  currency: z.enum(["TWD", "USD", "CNY", "JPY"]).default("TWD"),
});

const dataSettingsSchema = z.object({
  autoBackup: z.boolean().default(true),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dataRetention: z.number().min(1).max(365).default(90),
  enableDataValidation: z.boolean().default(true),
  compressionEnabled: z.boolean().default(false),
});

const securitySettingsSchema = z.object({
  enableTwoFactor: z.boolean().default(false),
  sessionTimeout: z.number().min(15).max(480).default(60),
  ipWhitelist: z.string().optional(),
  enableAuditLog: z.boolean().default(true),
  passwordPolicy: z.object({
    minLength: z.number().min(8).max(32).default(12),
    requireNumbers: z.boolean().default(true),
    requireSymbols: z.boolean().default(true),
  }),
});

const adminPasswordChangeSchema = z.object({
  newPassword: z.string().min(6, "管理員密碼至少6位數"),
  confirmPassword: z.string().min(6, "確認密碼至少6位數"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "密碼與確認密碼不符",
  path: ["confirmPassword"],
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  taskCompletionAlerts: z.boolean().default(true),
  errorAlerts: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
  maintenanceAlerts: z.boolean().default(true),
  notificationEmail: z.string().email("請輸入有效的電子郵件").optional(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;
type DataSettingsForm = z.infer<typeof dataSettingsSchema>;
type SecuritySettingsForm = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsForm = z.infer<typeof notificationSettingsSchema>;
type AdminPasswordChangeForm = z.infer<typeof adminPasswordChangeSchema>;

export default function Settings() {
  const [selectedTab, setSelectedTab] = useState("general");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("NorthSea2024!");
  const { toast } = useToast();

  const generalForm = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "北金國際North™Sea",
      language: "zh-TW",
      timezone: "Asia/Taipei",
      dateFormat: "YYYY-MM-DD",
      currency: "TWD",
    },
  });

  const dataForm = useForm<DataSettingsForm>({
    resolver: zodResolver(dataSettingsSchema),
    defaultValues: {
      autoBackup: true,
      backupFrequency: "daily",
      dataRetention: 90,
      enableDataValidation: true,
      compressionEnabled: false,
    },
  });

  const securityForm = useForm<SecuritySettingsForm>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      enableTwoFactor: false,
      sessionTimeout: 60,
      enableAuditLog: true,
      passwordPolicy: {
        minLength: 12,
        requireNumbers: true,
        requireSymbols: true,
      },
    },
  });

  const passwordChangeForm = useForm<AdminPasswordChangeForm>({
    resolver: zodResolver(adminPasswordChangeSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      taskCompletionAlerts: true,
      errorAlerts: true,
      weeklyReports: true,
      maintenanceAlerts: true,
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/settings", {
        method: "POST",
        data,
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: AdminPasswordChangeForm) => {
      return await apiRequest("/api/admin/change-password", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "密碼已修正！",
        className: "bg-green-800 border-green-700 text-green-100",
      });
      setAdminPassword(passwordChangeForm.getValues("newPassword"));
      setIsPasswordDialogOpen(false);
      passwordChangeForm.reset();
    },
    onError: (error) => {
      toast({
        title: "錯誤", 
        description: "密碼修改失敗，請重試",
        variant: "destructive",
      });
    },
  });

  const onSaveGeneral = (data: GeneralSettingsForm) => {
    saveSettingsMutation.mutate({ type: "general", settings: data });
  };

  const onSaveData = (data: DataSettingsForm) => {
    saveSettingsMutation.mutate({ type: "data", settings: data });
  };

  const onSaveSecurity = (data: SecuritySettingsForm) => {
    saveSettingsMutation.mutate({ type: "security", settings: data });
  };

  const onSaveNotifications = (data: NotificationSettingsForm) => {
    saveSettingsMutation.mutate({ type: "notifications", settings: data });
  };

  const onChangePassword = (data: AdminPasswordChangeForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">系統設置</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook數據收集系統配置</p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg">一般設置</TabsTrigger>
            <TabsTrigger value="data" className="rounded-lg">數據設置</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">安全設置</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg">通知設置</TabsTrigger>
            <TabsTrigger value="api" className="rounded-lg">API配置</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  一般設置
                </CardTitle>
                <CardDescription className="text-slate-400">
                  配置基本的系統設置和顯示偏好
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onSaveGeneral)} className="space-y-6">
                    <FormField
                      control={generalForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">公司名稱</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400">
                            將在系統界面和報告中顯示
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">顯示語言</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                <SelectItem value="zh-TW">繁體中文</SelectItem>
                                <SelectItem value="zh-CN">簡體中文</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ja">日本語</SelectItem>
                                <SelectItem value="ko">한국어</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">時區</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                <SelectItem value="Asia/Taipei">台北 (UTC+8)</SelectItem>
                                <SelectItem value="Asia/Shanghai">上海 (UTC+8)</SelectItem>
                                <SelectItem value="Asia/Tokyo">東京 (UTC+9)</SelectItem>
                                <SelectItem value="Asia/Seoul">首爾 (UTC+9)</SelectItem>
                                <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={generalForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">日期格式</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                <SelectItem value="YYYY-MM-DD">2024-06-03</SelectItem>
                                <SelectItem value="DD/MM/YYYY">03/06/2024</SelectItem>
                                <SelectItem value="MM/DD/YYYY">06/03/2024</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">貨幣</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                <SelectItem value="TWD">新台幣 (TWD)</SelectItem>
                                <SelectItem value="USD">美元 (USD)</SelectItem>
                                <SelectItem value="CNY">人民幣 (CNY)</SelectItem>
                                <SelectItem value="JPY">日圓 (JPY)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveSettingsMutation.isPending ? "保存中..." : "保存設置"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  數據設置
                </CardTitle>
                <CardDescription className="text-slate-400">
                  配置數據備份、存儲和處理相關設置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...dataForm}>
                  <form onSubmit={dataForm.handleSubmit(onSaveData)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={dataForm.control}
                        name="autoBackup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">自動備份</FormLabel>
                              <FormDescription className="text-slate-400">
                                定期自動備份收集的數據
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

                      <FormField
                        control={dataForm.control}
                        name="enableDataValidation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">數據驗證</FormLabel>
                              <FormDescription className="text-slate-400">
                                在收集時驗證數據完整性
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

                      <FormField
                        control={dataForm.control}
                        name="compressionEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">數據壓縮</FormLabel>
                              <FormDescription className="text-slate-400">
                                壓縮存儲的數據以節省空間
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
                    </div>

                    <Separator className="bg-slate-600" />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={dataForm.control}
                        name="backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">備份頻率</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                <SelectItem value="daily">每日</SelectItem>
                                <SelectItem value="weekly">每週</SelectItem>
                                <SelectItem value="monthly">每月</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={dataForm.control}
                        name="dataRetention"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">數據保留期 (天)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                              超過此期間的數據將被自動清理
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveSettingsMutation.isPending ? "保存中..." : "保存設置"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全設置
                </CardTitle>
                <CardDescription className="text-slate-400">
                  配置系統安全和用戶認證相關設置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSaveSecurity)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="enableTwoFactor"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">雙因子認證</FormLabel>
                              <FormDescription className="text-slate-400">
                                為帳戶增加額外的安全保護
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

                      <FormField
                        control={securityForm.control}
                        name="enableAuditLog"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">審計日誌</FormLabel>
                              <FormDescription className="text-slate-400">
                                記錄所有系統操作和存取活動
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
                    </div>

                    <Separator className="bg-slate-600" />

                    <div className="space-y-6">
                      <FormField
                        control={securityForm.control}
                        name="sessionTimeout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">會話超時 (分鐘)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={15}
                                max={480}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                              用戶閒置多久後自動登出
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                        <div className="space-y-0.5">
                          <div className="text-slate-200 flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            管理員密碼
                          </div>
                          <div className="text-slate-400 text-sm">
                            用於敏感操作驗證的管理員密碼（查看帳號密碼、編輯帳號等）
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPasswordDialogOpen(true)}
                          className="bg-slate-600 border-slate-500 text-slate-100 hover:bg-slate-500 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          編輯
                        </Button>
                      </div>

                      <FormField
                        control={securityForm.control}
                        name="ipWhitelist"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-200">IP白名單</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="192.168.1.0/24, 10.0.0.1"
                                className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                              僅允許指定IP地址存取系統，用逗號分隔
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveSettingsMutation.isPending ? "保存中..." : "保存設置"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知設置
                </CardTitle>
                <CardDescription className="text-slate-400">
                  配置系統通知和警報設置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onSaveNotifications)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="notificationEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">通知郵箱</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              placeholder="notifications@northsea.com"
                              className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400">
                            接收系統通知的郵箱地址
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="bg-slate-600" />

                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">郵件通知</FormLabel>
                              <FormDescription className="text-slate-400">
                                接收系統事件的郵件通知
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

                      <FormField
                        control={notificationForm.control}
                        name="taskCompletionAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">任務完成通知</FormLabel>
                              <FormDescription className="text-slate-400">
                                數據收集任務完成時通知
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

                      <FormField
                        control={notificationForm.control}
                        name="errorAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">錯誤警報</FormLabel>
                              <FormDescription className="text-slate-400">
                                系統發生錯誤時立即通知
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

                      <FormField
                        control={notificationForm.control}
                        name="weeklyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-4 bg-slate-700/50">
                            <div className="space-y-0.5">
                              <FormLabel className="text-slate-200">週報</FormLabel>
                              <FormDescription className="text-slate-400">
                                每週發送數據收集摘要報告
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
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveSettingsMutation.isPending ? "保存中..." : "保存設置"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API配置
                </CardTitle>
                <CardDescription className="text-slate-400">
                  管理外部服務API密鑰和配置
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-100">Facebook Graph API</h3>
                          <p className="text-slate-400 text-sm">用於Facebook數據收集</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-sm">未配置</span>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            配置
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-100">Google Translate API</h3>
                          <p className="text-slate-400 text-sm">用於多語言翻譯功能</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-sm">未配置</span>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            配置
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 rounded-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-100">SMTP服務</h3>
                          <p className="text-slate-400 text-sm">用於發送郵件通知</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-sm">已配置</span>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            測試
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                  <h4 className="font-medium text-slate-100 mb-2">API使用統計</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-100">1,247</p>
                      <p className="text-slate-400 text-sm">本月請求</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-100">98.5%</p>
                      <p className="text-slate-400 text-sm">成功率</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-100">145ms</p>
                      <p className="text-slate-400 text-sm">平均響應</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admin Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" />
              修改管理員密碼
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              請輸入新的管理員密碼以確保系統安全
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordChangeForm}>
            <form onSubmit={passwordChangeForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField
                control={passwordChangeForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">新密碼</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder="輸入新密碼"
                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordChangeForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">確認密碼</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder="再次輸入新密碼"
                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    passwordChangeForm.reset();
                  }}
                  className="bg-slate-600 border-slate-500 text-slate-100 hover:bg-slate-500 rounded-lg"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {changePasswordMutation.isPending ? "修改中..." : "確認修改"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
