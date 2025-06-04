import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Eye, Trash2, Heart, MessageCircle, Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CollectedDataItem {
  id: number;
  content: string;
  author: {
    name: string;
    followers: string;
    avatar: string;
  };
  publishTime: string;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
  };
  status: string;
}

export default function DataTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const limit = 10;
  const offset = (currentPage - 1) * limit;

  const { data: collectedData, isLoading } = useQuery({
    queryKey: ["/api/data", { limit, offset, search: searchQuery }],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const deleteDataMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/data/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "刪除成功",
        description: "數據項目已刪除",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data"] });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "無法刪除數據項目",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest("POST", "/api/export", {
        ids,
        format: "csv",
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "導出成功",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "導出失敗",
        description: "無法導出數據",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(collectedData?.data?.map((item: CollectedDataItem) => item.id) || []);
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleExport = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "請選擇要導出的數據",
        variant: "destructive",
      });
      return;
    }
    exportMutation.mutate(Array.from(selectedItems));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return <Badge className="bg-green-600 text-green-100 border-green-600">已收集</Badge>;
      case "processing":
        return <Badge className="bg-blue-600 text-blue-100 border-blue-600">處理中</Badge>;
      default:
        return <Badge className="bg-slate-600 text-slate-100 border-slate-600">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">收集數據</h3>
            <p className="text-slate-400 mt-1">最近收集的 Facebook 數據</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                placeholder="搜索數據..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-700 border-slate-600 text-slate-100 rounded-lg placeholder:text-slate-400"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>
            <Button
              onClick={handleExport}
              disabled={selectedItems.size === 0 || exportMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg border-0"
            >
              <Download className="mr-2 h-4 w-4" />
              {selectedItems.size > 0 ? `導出 (${selectedItems.size})` : "導出"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={
                      collectedData?.data?.length > 0 &&
                      selectedItems.size === collectedData.data.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  內容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  發布時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  互動數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/30 divide-y divide-slate-700">
              {collectedData?.data?.map((item: CollectedDataItem) => (
                <tr key={item.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-slate-700 rounded-lg flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-100 line-clamp-2">
                          {item.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">貼文內容</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {item.type === 'post' ? 'P' : item.type === 'comment' ? 'C' : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">系統收集</p>
                        <p className="text-xs text-slate-400">自動收集</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(item.publishTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 text-red-500 mr-1" />
                        0
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-4 w-4 text-blue-500 mr-1" />
                        0
                      </span>
                      <span className="flex items-center">
                        <Share className="h-4 w-4 text-green-500 mr-1" />
                        0
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700/50">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 hover:bg-slate-700/50">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700/50"
                        onClick={() => deleteDataMutation.mutate(item.id)}
                        disabled={deleteDataMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {collectedData?.total > 0 ? (
              <>
                顯示 <span className="font-medium">{offset + 1}</span> 到{" "}
                <span className="font-medium">
                  {Math.min(offset + limit, collectedData?.total || 0)}
                </span>{" "}
                項，共 <span className="font-medium">{collectedData?.total || 0}</span> 項結果
              </>
            ) : (
              "沒有找到數據"
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
            >
              上一頁
            </Button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">
              第 {currentPage} 頁
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!collectedData?.data || collectedData.data.length < limit || (collectedData?.total && offset + limit >= collectedData.total)}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600 rounded-lg"
            >
              下一頁
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
