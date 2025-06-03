import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, MapPin, GraduationCap, Briefcase, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { FacebookFriend, FacebookAccount } from "@shared/schema";

const searchFriendsSchema = z.object({
  keyword: z.string().min(1, "關鍵字為必填"),
  location: z.string().optional(),
  school: z.string().optional(),
});

type SearchFriendsForm = z.infer<typeof searchFriendsSchema>;

const addFriendSchema = z.object({
  accountId: z.number().min(1, "請選擇帳號"),
  friendName: z.string().min(1, "好友名稱為必填"),
  location: z.string().optional(),
  school: z.string().optional(),
  workplace: z.string().optional(),
});

type AddFriendForm = z.infer<typeof addFriendSchema>;

export default function FacebookFriends() {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/facebook/accounts"],
  });

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["/api/facebook/friends", selectedAccount, searchQuery],
    enabled: !!selectedAccount || !!searchQuery,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/facebook/friends/search"],
    enabled: false,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (data: AddFriendForm) => {
      return await apiRequest("/api/facebook/friends", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          friendId: `fb_${Date.now()}`,
          status: "pending",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/friends"] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
  });

  const searchForm = useForm<SearchFriendsForm>({
    resolver: zodResolver(searchFriendsSchema),
    defaultValues: {
      keyword: "",
      location: "",
      school: "",
    },
  });

  const addForm = useForm<AddFriendForm>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: {
      accountId: 0,
      friendName: "",
      location: "",
      school: "",
      workplace: "",
    },
  });

  const onSearch = async (data: SearchFriendsForm) => {
    try {
      const results = await apiRequest(
        `/api/facebook/friends/search?keyword=${encodeURIComponent(data.keyword)}&location=${encodeURIComponent(data.location || "")}&school=${encodeURIComponent(data.school || "")}`,
        { method: "GET" }
      );
      queryClient.setQueryData(["/api/facebook/friends/search"], results);
      setIsSearchDialogOpen(false);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const onAddFriend = (data: AddFriendForm) => {
    addFriendMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">已接受</Badge>;
      case "pending":
        return <Badge variant="secondary">待處理</Badge>;
      case "rejected":
        return <Badge variant="destructive">已拒絕</Badge>;
      case "blocked":
        return <Badge variant="outline">已封鎖</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">好友管理</h1>
          <p className="text-gray-600 mt-2">管理Facebook好友，搜尋並新增潛在聯絡人</p>
        </div>
        
        <div className="flex space-x-3">
          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" />
                關鍵字搜尋
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>搜尋好友</DialogTitle>
                <DialogDescription>
                  根據關鍵字、地區和學校搜尋潛在好友
                </DialogDescription>
              </DialogHeader>
              
              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                  <FormField
                    control={searchForm.control}
                    name="keyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>關鍵字</FormLabel>
                        <FormControl>
                          <Input placeholder="姓名或職業" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={searchForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>地區（可選）</FormLabel>
                        <FormControl>
                          <Input placeholder="台北、高雄等" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={searchForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>學校（可選）</FormLabel>
                        <FormControl>
                          <Input placeholder="台灣大學、清華大學等" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSearchDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      <Search className="w-4 h-4 mr-2" />
                      搜尋
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                新增好友
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增Facebook好友</DialogTitle>
                <DialogDescription>
                  手動添加新的Facebook好友到指定帳號
                </DialogDescription>
              </DialogHeader>
              
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddFriend)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>選擇帳號</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇Facebook帳號" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account: FacebookAccount) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.accountName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="friendName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>好友姓名</FormLabel>
                        <FormControl>
                          <Input placeholder="請輸入好友姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>地區（可選）</FormLabel>
                        <FormControl>
                          <Input placeholder="台北、高雄等" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>學校（可選）</FormLabel>
                        <FormControl>
                          <Input placeholder="台灣大學、清華大學等" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="workplace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>工作地點（可選）</FormLabel>
                        <FormControl>
                          <Input placeholder="公司或機構名稱" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={addFriendMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {addFriendMutation.isPending ? "新增中..." : "新增好友"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-64">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="選擇帳號" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">所有帳號</SelectItem>
              {accounts.map((account: FacebookAccount) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Input
            placeholder="搜尋好友姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend: FacebookFriend) => (
            <Card key={friend.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{friend.friendName}</CardTitle>
                    <CardDescription>好友ID：{friend.friendId}</CardDescription>
                  </div>
                  {getStatusBadge(friend.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {friend.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{friend.location}</span>
                  </div>
                )}
                
                {friend.school && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{friend.school}</span>
                  </div>
                )}
                
                {friend.workplace && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{friend.workplace}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{friend.mutualFriends || 0} 共同好友</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(friend.addedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    訊息
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    查看檔案
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {friends.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedAccount ? "此帳號暫無好友" : "請選擇帳號查看好友"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedAccount 
                    ? "開始搜尋和新增好友以擴展您的網絡" 
                    : "選擇一個Facebook帳號以查看其好友清單"
                  }
                </p>
                {selectedAccount && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    新增第一個好友
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}