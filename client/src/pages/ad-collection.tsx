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
  Zap,
  Clock,
  Link as LinkIcon,
  Users,
  Building
} from "lucide-react";

interface AdCollectionData {
  id: number;
  keyword: string;
  adLink: string;
  fanPageName: string;
  fanPageLink: string;
  groupName?: string;
  groupLink?: string;
  collectTime: string;
  adSpend?: number;
  impressions?: number;
  clicks?: number;
  adType?: string;
}

export default function AdCollection() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [adUrl, setAdUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // 獲取廣告採集數據
  const { data: adData = [], isLoading } = useQuery({
    queryKey: ["/api/ad-collection", currentPage],
  });

  // 搜索廣告
  const searchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/ad-collection/search", {
        method: "POST",
        data: { 
          keyword: searchKeyword,
          adUrl: adUrl
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-collection"] });
    },
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      const response = await apiRequest(`/api/ad-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ads_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/ad-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad-collection"] });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/ad-collection"] });
  };

  const handleSearch = () => {
    if (searchKeyword.trim() || adUrl.trim()) {
      searchMutation.mutate();
    }
  };

  const mockAdData: AdCollectionData[] = [
    {
      id: 1,
      keyword: "UBER EATS",
      adLink: "https://facebook.com/ads/123456789",
      fanPageName: "Uber Eats Taiwan",
      fanPageLink: "https://facebook.com/ubereats.tw",
      groupName: "台北美食外送討論區",
      groupLink: "https://facebook.com/groups/taipei.delivery",
      collectTime: "2024-12-06 23:30:15",
      adSpend: 5000,
      impressions: 125000,
      clicks: 3500,
      adType: "影片廣告"
    },
    {
      id: 2,
      keyword: "熊貓外送",
      adLink: "https://facebook.com/ads/987654321",
      fanPageName: "熊貓外送官方",
      fanPageLink: "https://facebook.com/foodpanda.tw",
      collectTime: "2024-12-06 23:28:42",
      adSpend: 8000,
      impressions: 89000,
      clicks: 2100,
      adType: "圖片廣告"
    }
  ];

  const displayData = adData.length > 0 ? adData : mockAdData;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">指定廣告採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              輸入關鍵字或廣告連結進行採集，找到競爭對手的廣告策略
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">關鍵字</label>
                <Input
                  placeholder="輸入競爭對手關鍵字（如：UBER EATS、熊貓外送）"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">廣告連結</label>
                <Input
                  placeholder="輸入 Facebook 廣告連結"
                  value={adUrl}
                  onChange={(e) => setAdUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">採集目標說明</h4>
              <p className="text-gray-300 text-sm">
                例如：搜索 "UBER EATS" 可以找到他們的粉絲專業和社團廣告，
                獲取這些 Facebook ID 作為您廣告投放的受眾名單，用於競爭分析和精準投放。
              </p>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || (!searchKeyword.trim() && !adUrl.trim())}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                搜索廣告
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 數據表格 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              採集結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">關鍵字</TableHead>
                  <TableHead className="text-gray-300">廣告連結</TableHead>
                  <TableHead className="text-gray-300">粉絲專業</TableHead>
                  <TableHead className="text-gray-300">社團連結</TableHead>
                  <TableHead className="text-gray-300">收集時間</TableHead>
                  <TableHead className="text-gray-300">廣告表現</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: AdCollectionData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-yellow-600 text-yellow-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={item.adLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                        查看廣告
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-white font-medium">{item.fanPageName}</span>
                        </div>
                        <a 
                          href={item.fanPageLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          粉絲專業
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.groupName && item.groupLink ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-white font-medium">{item.groupName}</span>
                          </div>
                          <a 
                            href={item.groupLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                          >
                            <LinkIcon className="h-3 w-3" />
                            社團連結
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-500">無社團數據</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{item.collectTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {item.adSpend && (
                          <Badge variant="secondary" className="bg-green-900/30 text-green-300 text-xs">
                            預算: ${item.adSpend.toLocaleString()}
                          </Badge>
                        )}
                        {item.impressions && (
                          <Badge variant="secondary" className="bg-blue-900/30 text-blue-300 text-xs">
                            曝光: {item.impressions.toLocaleString()}
                          </Badge>
                        )}
                        {item.clicks && (
                          <Badge variant="secondary" className="bg-orange-900/30 text-orange-300 text-xs">
                            點擊: {item.clicks.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {displayData.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400">
                暫無採集數據，請輸入競爭對手關鍵字開始採集
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