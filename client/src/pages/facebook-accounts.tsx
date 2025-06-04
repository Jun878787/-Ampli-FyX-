import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Users, MessageCircle, Power, PowerOff, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FacebookAccount } from "@shared/schema";

const createAccountSchema = z.object({
  accountName: z.string().min(1, "帳號名稱為必填"),
  email: z.string().email("請輸入有效的電子郵件"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

export default function FacebookAccounts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FacebookAccount | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/facebook/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountForm) => {
      return await apiRequest("POST", "/api/facebook/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "帳號創建成功",
        description: "Facebook帳號已成功創建並加入管理系統",
      });
    },
    onError: (error: any) => {
      toast({
        title: "創建失敗",
        description: error.message || "無法創建Facebook帳號，請檢查輸入資料",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest("PATCH", `/api/facebook/accounts/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      toast({
        title: "帳號更新成功",
        description: "Facebook帳號資訊已成功更新",
      });
    },
    onError: (error: any) => {
      toast({
        title: "更新失敗",
        description: error.message || "無法更新帳號資訊，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/facebook/accounts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      toast({
        title: "帳號刪除成功",
        description: "Facebook帳號已從系統中移除",
      });
    },
    onError: (error: any) => {
      toast({
        title: "刪除失敗",
        description: error.message || "無法刪除帳號，請稍後再試",
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      accountName: "",
      email: "",
      status: "active",
    },
  });

  const editForm = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      accountName: "",
      email: "",
      status: "active",
    },
  });

  const onSubmit = (data: CreateAccountForm) => {
    createAccountMutation.mutate(data);
  };

  const onEditSubmit = (data: CreateAccountForm) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ 
        id: editingAccount.id, 
        updates: data 
      });
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      editForm.reset();
    }
  };

  // 切換帳號狀態
  const toggleAccountStatus = (account: FacebookAccount) => {
    const newStatus = account.status === "active" ? "inactive" : "active";
    updateAccountMutation.mutate({ 
      id: account.id, 
      updates: { status: newStatus } 
    });
  };

  // 編輯帳號
  const handleEditAccount = (account: FacebookAccount) => {
    setEditingAccount(account);
    editForm.reset({
      accountName: account.accountName,
      email: account.email,
      status: account.status as "active" | "inactive" | "suspended",
    });
    setIsEditDialogOpen(true);
  };

  // 刪除帳號
  const handleDeleteAccount = (account: FacebookAccount) => {
    if (window.confirm(`確定要刪除帳號 "${account.accountName}" 嗎？此操作無法撤銷。`)) {
      deleteAccountMutation.mutate(account.id);
    }
  };

  // 查看好友
  const handleViewFriends = (account: FacebookAccount) => {
    toast({
      title: "好友管理",
      description: `正在載入 ${account.accountName} 的好友列表...`,
    });
    window.location.href = `/facebook-friends?accountId=${account.id}`;
  };

  // 發送訊息
  const handleSendMessage = (account: FacebookAccount) => {
    toast({
      title: "訊息功能",
      description: `正在開啟 ${account.accountName} 的訊息功能...`,
    });
    window.location.href = `/auto-messaging?accountId=${account.id}`;
  };

  // 帳號設定
  const handleAccountSettings = (account: FacebookAccount) => {
    toast({
      title: "帳號設定",
      description: `正在載入 ${account.accountName} 的設定選項...`,
    });
    handleEditAccount(account);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-green-100 border-green-600">活躍</Badge>;
      case "inactive":
        return <Badge className="bg-slate-600 text-slate-100 border-slate-600">未活躍</Badge>;
      case "suspended":
        return <Badge className="bg-red-600 text-red-100 border-red-600">已暫停</Badge>;
      default:
        return <Badge className="bg-slate-500 text-slate-100 border-slate-500">未知</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Facebook 帳號管理</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - 管理多個Facebook帳號，統一控制和監控</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-0">
                <Plus className="h-4 w-4 mr-2" />
                新增帳號
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">新增 Facebook 帳號</DialogTitle>
                <DialogDescription className="text-slate-400">
                  添加新的Facebook帳號到管理系統
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">帳號名稱</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="輸入帳號名稱" 
                            {...field} 
                            className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg placeholder:text-slate-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">電子郵件</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="輸入電子郵件" 
                            type="email" 
                            {...field} 
                            className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg placeholder:text-slate-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">狀態</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                            <SelectItem value="active">活躍</SelectItem>
                            <SelectItem value="inactive">未活躍</SelectItem>
                            <SelectItem value="suspended">已暫停</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAccountMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-0"
                    >
                      {createAccountMutation.isPending ? "創建中..." : "創建帳號"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 編輯帳號對話框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-100">編輯 Facebook 帳號</DialogTitle>
              <DialogDescription className="text-slate-400">
                修改帳號資訊和設定
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">帳號名稱</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="輸入帳號名稱" 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">電子郵件</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="輸入電子郵件" 
                          type="email" 
                          {...field} 
                          className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">狀態</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                          <SelectItem value="active">活躍</SelectItem>
                          <SelectItem value="inactive">未活躍</SelectItem>
                          <SelectItem value="suspended">已暫停</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
                  >
                    取消
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateAccountMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-0"
                  >
                    {updateAccountMutation.isPending ? "更新中..." : "更新帳號"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 帳號列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <div className="text-slate-400">載入中...</div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <div className="text-slate-400 mb-4">尚未添加任何Facebook帳號</div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加第一個帳號
              </Button>
            </div>
          ) : (
            accounts.map((account: any) => (
              <Card key={account.id} className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-100">
                        {account.accountName}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {account.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleViewFriends(account)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      好友
                    </Button>
                    <Button
                      onClick={() => handleSendMessage(account)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      訊息
                    </Button>
                    <Button
                      onClick={() => handleAccountSettings(account)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      編輯
                    </Button>
                    <Button
                      onClick={() => toggleAccountStatus(account)}
                      variant="outline"
                      size="sm"
                      className={`rounded-lg border-0 ${
                        account.status === "active"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {account.status === "active" ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          停用
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          啟用
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleDeleteAccount(account)}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg border-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      刪除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}