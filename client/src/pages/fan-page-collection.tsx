import { useState, useEffect } from "react";
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
  Circle,
  Info
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
  const [logs, setLogs] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [displayData, setDisplayData] = useState<FanPageData[]>([]);
  const [isSearched, setIsSearched] = useState(false);

  // 獲取粉絲團採集數據
  const { data: fanPageData = [], isLoading } = useQuery<FanPageData[]>({
    queryKey: ["/api/fan-page-collection", currentPage],
  });

  // 搜索粉絲團
  const searchMutation = useMutation({
    mutationFn: async () => {
      setLogs(prev => [...prev, `正在搜索關鍵字: ${searchKeyword}`]);
      try {
        const response = await apiRequest(`/api/facebook/search/pages?keyword=${encodeURIComponent(searchKeyword)}&limit=100`);
        try {
          const data = await response.json();
          if (data.success && data.data) {
            setDisplayData(data.data);
            setLogs(prev => [...prev, `成功獲取 ${data.data.length} 條數據`]);
          } else {
            setLogs(prev => [...prev, `搜索失敗: ${data.error || '未知錯誤'}`]);
          }
          return response;
        } catch (jsonError) {
          // 處理JSON解析錯誤
          console.error('JSON解析錯誤:', jsonError);
          setLogs(prev => [
            ...prev, 
            `搜索失敗: 伺服器返回了無效的JSON響應`,
            `可能原因: Facebook API密鑰已過期或無效，請聯繫管理員更新API密鑰`
          ]);
          throw new Error(`JSON解析錯誤: ${jsonError.message}`);
        }
      } catch (fetchError) {
        console.error('請求錯誤:', fetchError);
        setLogs(prev => [...prev, `搜索失敗: ${fetchError.message}`]);
        throw fetchError;
      }
    },
    onSuccess: () => {
      setIsSearched(true);
      setLogs(prev => [...prev, "搜索完成"]);
    },
    onError: (error: Error) => {
      setLogs(prev => [...prev, `採集失敗: ${error.message}`]);
    }
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      setLogs(prev => [...prev, `正在導出數據: ${type}`]);
      const response = await apiRequest(`/api/fan-page-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([await response.text()], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fan_pages_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setLogs(prev => [...prev, `導出完成: ${type}`]);
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      setLogs(prev => [...prev, "正在清空數據"]);
      await apiRequest("/api/fan-page-collection", {
        method: "DELETE",
      });
      setLogs(prev => [...prev, "數據已清空"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fan-page-collection"] });
    },
  });

  // 刷新數據
  const refreshData = () => {
    setLogs(prev => [...prev, "正在刷新數據"]);
    queryClient.invalidateQueries({ queryKey: ["/api/fan-page-collection"] });
    setLogs(prev => [...prev, "數據已刷新"]);
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

  // 使用 useEffect 來更新 displayData
  useEffect(() => {
    if (fanPageData.length > 0 && !isSearched) {
      setDisplayData(fanPageData);
    } else if (fanPageData.length === 0 && !isSearched && displayData.length === 0) {
      setDisplayData(mockFanPageData);
    }
  }, [fanPageData, isSearched]);

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

        {/* 日誌區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5" />
              採集日誌
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-700 p-4 rounded-lg max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-300 text-sm mb-1">
                  {log}
                </div>
              ))}
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
                    <TableCell className="text-gray-300">{item.username}</TableCell>
                    <TableCell className="text-gray-300">
                      <img src={item.avatar} alt={item.username} className="w-10 h-10 rounded-full" />
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <a href={item.fbAccountLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {item.fbAccountLink}
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-300">{item.collectTime}</TableCell>
                    <TableCell className="text-gray-300">{item.city}</TableCell>
                    <TableCell className="text-gray-300">{item.followerCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}