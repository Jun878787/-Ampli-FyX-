import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Users, MessageCircle, Power, PowerOff } from "lucide-react";
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
import type { FacebookAccount } from "@shared/schema";

const createAccountSchema = z.object({
  accountName: z.string().min(1, "帳號名稱為必填"),
  email: z.string().email("請輸入有效的電子郵件"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

export default function FacebookAccounts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/facebook/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountForm) => {
      return await apiRequest("/api/facebook/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/facebook/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/accounts"] });
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

  const onSubmit = (data: CreateAccountForm) => {
    createAccountMutation.mutate(data);
  };

  const toggleAccountStatus = (account: FacebookAccount) => {
    const newStatus = account.status === "active" ? "inactive" : "active";
    updateAccountMutation.mutate({ id: account.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">活躍</Badge>;
      case "inactive":
        return <Badge variant="secondary">未活躍</Badge>;
      case "suspended":
        return <Badge variant="destructive">已暫停</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facebook 帳號管理</h1>
          <p className="text-gray-600 mt-2">管理多個Facebook帳號，統一控制和監控</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              添加帳號
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新的Facebook帳號</DialogTitle>
              <DialogDescription>
                添加一個新的Facebook帳號到北金國際North™Sea管理系統
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>帳號名稱</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：北金國際主帳號" {...field} />
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
                      <FormLabel>電子郵件</FormLabel>
                      <FormControl>
                        <Input placeholder="account@northsea.com" type="email" {...field} />
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
                      <FormLabel>狀態</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇帳號狀態" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAccountMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createAccountMutation.isPending ? "添加中..." : "添加帳號"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account: FacebookAccount) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.accountName}</CardTitle>
                    <CardDescription>{account.email}</CardDescription>
                  </div>
                  {getStatusBadge(account.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{account.friendsCount || 0} 好友</span>
                  </div>
                  {account.lastLogin && (
                    <span className="text-gray-500">
                      最後登入：{new Date(account.lastLogin).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAccountStatus(account)}
                    disabled={updateAccountMutation.isPending}
                    className="flex-1"
                  >
                    {account.status === "active" ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-1" />
                        停用
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1" />
                        啟用
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="w-4 h-4 mr-1" />
                    設定
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    訊息
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  尚未添加任何Facebook帳號
                </h3>
                <p className="text-gray-500 mb-6">
                  開始添加Facebook帳號以管理您的社交媒體操作
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一個帳號
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}