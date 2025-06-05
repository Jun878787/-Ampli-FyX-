import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  MessageSquare,
  User,
  Clock,
  Hash,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordData {
  id: number;
  keyword: string;
  publisherName: string;
  publisherId: string;
  content: string;
  publishTime: string;
  collectTime: string;
  engagementCount?: number;
  postType?: string;
}

export default function KeywordCollection() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // 獲取關鍵詞採集數據
  const { data: keywordData = [], isLoading } = useQuery({
    queryKey: ["/api/keyword-collection", currentPage],
  });

  // 搜索關鍵詞
  const searchMutation = useMutation({
    mutationFn: async () => {
      const keywordList = keywords.split('\n').filter(k => k.trim());
      let allResults: any[] = [];
      
      for (const keyword of keywordList) {
        setLogs(prev => [...prev, `正在搜索關鍵字: ${keyword}`]);
        try {
          const response = await apiRequest(`/api/facebook/search/pages?keyword=${encodeURIComponent(keyword)}&limit=50`);
          try {
            const data = await response.json();
            if (data.success && data.data) {
              allResults = [...allResults, ...data.data];
              setLogs(prev => [...prev, `成功獲取 ${data.data.length} 條數據`]);
            } else {
              setLogs(prev => [...prev, `搜索失敗: ${data.error || '未知錯誤'}`]);
            }
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
          // 繼續處理下一個關鍵詞，而不是中斷整個過程
          continue;
        }
      }
      
      setDisplayData(allResults);
      return { data: allResults };
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
      const response = await apiRequest(`/api/keyword-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([await response.text()], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keywords_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setLogs(prev => [...prev, `導出完成: ${type}`]);
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      setLogs(prev => [...prev, "正在清空數據"]);
      await apiRequest("/api/keyword-collection", {
        method: "DELETE",
      });
      setLogs(prev => [...prev, "數據已清空"]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
    },
  });

  const refreshData = () => {
    setLogs(prev => [...prev, "正在刷新數據"]);
    queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
    setLogs(prev => [...prev, "數據已刷新"]);
  };

  const handleSearch = () => {
    if (keywords.trim()) {
      searchMutation.mutate();
    }
  };

  const handleKeywordCollection = async () => {
    if (!keywords.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入關鍵字",
        variant: "destructive",
      });
      return;
    }
    try {
      setLogs(prev => [...prev, "開始關鍵詞彙採集"]);
      const response = await apiRequest(`/api/keyword-collection/start`, { method: "POST", data: { keywords: keywords.split('\n').filter(k => k.trim()) } });
      const result = await response.json();
      toast({
        title: "開始關鍵詞彙採集",
        description: "採集任務已啟動",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
      setLogs(prev => [...prev, "採集任務已啟動"]);
    } catch (error: any) {
      toast({
        title: "啟動失敗",
        description: error.message || "無法啟動關鍵詞彙採集",
        variant: "destructive",
      });
      setLogs(prev => [...prev, `採集失敗: ${error.message || "未知錯誤"}`]);
    }
  };

  const mockKeywordData: KeywordData[] = [
    {
      id: 1,
      keyword: "熊貓外送",
      publisherName: "台北美食愛好者",
      publisherId: "FB123456789",
      content: "今天用熊貓外送點了超好吃的日式料理，配送超快！推薦給大家～ #熊貓外送 #美食",
      publishTime: "2024-12-06 20:30:15",
      collectTime: "2024-12-06 23:30:15",
      engagementCount: 45,
      postType: "貼文"
    },
    {
      id: 2,
      keyword: "UBER EATS",
      publisherName: "小資族省錢日記",
      publisherId: "FB987654321",
      content: "UBER EATS今天有優惠券，終於可以省點錢吃好料了！有人要一起團購嗎？",
      publishTime: "2024-12-06 19:45:22",
      collectTime: "2024-12-06 23:28:42",
      engagementCount: 23,
      postType: "貼文"
    }
  ];

  // Use displayData state for search results, fallback to keywordData if not searched
  const dataToShow = isSearched ? displayData : (Array.isArray(keywordData) ? keywordData : mockKeywordData);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-green-400" />
          <h1 className="text-3xl font-bold text-white">關鍵詞彙採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              輸入多個關鍵字進行內容採集，每行一個關鍵字
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">關鍵字列表</label>
              <Textarea
                placeholder={`輸入關鍵字，每行一個：\n熊貓外送\nUBER EATS\n外送平台\n美食外送\n台北外送`}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                rows={6}
              />
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleKeywordCollection}
                disabled={!keywords.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                開始採集
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
              <MessageSquare className="h-5 w-5" />
              採集結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">關鍵字</TableHead>
                  <TableHead className="text-gray-300">發布者姓名</TableHead>
                  <TableHead className="text-gray-300">發布者 ID</TableHead>
                  <TableHead className="text-gray-300">內容</TableHead>
                  <TableHead className="text-gray-300">發布時間</TableHead>
                  <TableHead className="text-gray-300">收集時間</TableHead>
                  <TableHead className="text-gray-300">互動數</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataToShow.map((item: any) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-green-600 text-green-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{item.publisherName}</TableCell>
                    <TableCell className="text-gray-300">{item.publisherId}</TableCell>
                    <TableCell className="text-gray-300">{item.content}</TableCell>
                    <TableCell className="text-gray-300">{item.publishTime}</TableCell>
                    <TableCell className="text-gray-300">{item.collectTime}</TableCell>
                    <TableCell className="text-gray-300">{item.engagementCount}</TableCell>
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