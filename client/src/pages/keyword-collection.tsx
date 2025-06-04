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
  Hash
} from "lucide-react";

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
  const [keywords, setKeywords] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // 獲取關鍵詞採集數據
  const { data: keywordData = [], isLoading } = useQuery({
    queryKey: ["/api/keyword-collection", currentPage],
  });

  // 搜索關鍵詞
  const searchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/keyword-collection/search", {
        method: "POST",
        body: JSON.stringify({ 
          keywords: keywords.split('\n').filter(k => k.trim())
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
    },
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      const response = await apiRequest(`/api/keyword-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keywords_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/keyword-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/keyword-collection"] });
  };

  const handleSearch = () => {
    if (keywords.trim()) {
      searchMutation.mutate();
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

  const displayData = keywordData.length > 0 ? keywordData : mockKeywordData;

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
                onClick={handleSearch}
                disabled={searchMutation.isPending || !keywords.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                開始採集
              </Button>
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
                {displayData.map((item: KeywordData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-green-600 text-green-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {item.publisherName}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {item.publisherId}
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-xs">
                      <div className="truncate" title={item.content}>
                        {item.content}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{item.publishTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{item.collectTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge variant="secondary" className="bg-purple-900/30 text-purple-300">
                        {item.engagementCount || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {displayData.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                暫無採集數據，請輸入關鍵字開始採集
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