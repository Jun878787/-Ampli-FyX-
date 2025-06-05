import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Users,
  MapPin,
  Clock,
  Link as LinkIcon,
  Circle
} from "lucide-react";

interface FanPageData {
  id: number;
  keyword: string;
  username: string;
  avatar: string;
  fbAccountLink: string;
  collectTime: string;
  city: string;
  followerCount?: number;
  pageCategory?: string;
}

export default function FanPageCollection() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // 獲取粉絲團採集數據
  const { data: fanPageData = [], isLoading } = useQuery({
    queryKey: ["/api/fan-page-collection", currentPage],
  });

  // 搜索粉絲團
  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/facebook/search/pages?keyword=${encodeURIComponent(searchKeyword)}&limit=100`);
      setDisplayData(response.data || []);
      return response;
    },
    onSuccess: () => {
      setIsSearched(true);
    },
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      const response = await apiRequest(`/api/fan-page-collection/export?type=${type}`, {
        method: "GET",
      });
      // 創建下載連結
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fan_pages_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/fan-page-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fan-page-collection"] });
    },
  });

  // 刷新數據
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/fan-page-collection"] });
  };

  const handleSearch = () => {
    if (searchKeyword.trim() || pageUrl.trim()) {
      searchMutation.mutate();
    }
  };

  const mockFanPageData: FanPageData[] = [
    {
      id: 1,
      keyword: "熊貓外送",
      username: "熊貓外送官方",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/foodpanda.tw",
      collectTime: "2024-12-06 23:30:15",
      city: "台北市",
      followerCount: 125000,
      pageCategory: "外送服務"
    },
    {
      id: 2,
      keyword: "UBER EATS",
      username: "Uber Eats Taiwan",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/ubereats.tw",
      collectTime: "2024-12-06 23:28:42",
      city: "台北市",
      followerCount: 89000,
      pageCategory: "外送服務"
    }
  ];

  const displayData = fanPageData.length > 0 ? fanPageData : mockFanPageData;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">粉絲團採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              輸入關鍵字或粉絲團連結進行採集
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">關鍵字</label>
                <Input
                  placeholder="輸入搜索關鍵字（如：熊貓外送、UBER EATS）"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">粉絲團連結</label>
                <Input
                  placeholder="輸入 Facebook 粉絲團連結"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || (!searchKeyword.trim() && !pageUrl.trim())}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 數據表格 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              採集結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">關鍵字</TableHead>
                  <TableHead className="text-gray-300">使用者名稱</TableHead>
                  <TableHead className="text-gray-300">頭像</TableHead>
                  <TableHead className="text-gray-300">FB 帳戶連結</TableHead>
                  <TableHead className="text-gray-300">收集時間</TableHead>
                  <TableHead className="text-gray-300">城市</TableHead>
                  <TableHead className="text-gray-300">追蹤者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: FanPageData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-blue-600 text-blue-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {item.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Circle className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-300 text-sm">頭像</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={item.fbAccountLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                        查看頁面
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {item.collectTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {item.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {item.followerCount?.toLocaleString() || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {displayData.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                暫無採集數據，請開始搜索
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-3">
                <Button 
                  onClick={() => exportMutation.mutate('all')}
                  disabled={exportMutation.isPending}
                  variant="outline" 
                  className="border-green-600 text-green-400 hover:bg-green-900/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  導出所有數據
                </Button>
                <Button 
                  onClick={() => exportMutation.mutate('current')}
                  disabled={exportMutation.isPending}
                  variant="outline" 
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  導出本頁
                </Button>
                <Button 
                  onClick={() => clearDataMutation.mutate()}
                  disabled={clearDataMutation.isPending}
                  variant="outline" 
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空數據
                </Button>
                <Button 
                  onClick={refreshData}
                  variant="outline" 
                  className="border-gray-600 text-gray-400 hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
              <Button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                variant="outline" 
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                下一頁
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}