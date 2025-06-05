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
  Lock,
  Unlock
} from "lucide-react";

interface GroupData {
  id: number;
  keyword: string;
  city: string;
  groupName: string;
  memberCount: number;
  groupLink: string;
  collectTime: string;
  isPublic: boolean;
  groupCategory?: string;
  description?: string;
}

export default function GroupCollection() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [groupUrl, setGroupUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const queryClient = useQueryClient();

  // 獲取社團採集數據
  const { data: groupData = [], isLoading } = useQuery({
    queryKey: ["/api/group-collection", currentPage],
  });

  // 搜索社團
  const searchMutation = useMutation({
    mutationFn: async () => {
      setLogs(prev => [...prev, `正在搜索關鍵字: ${searchKeyword}`]);
      try {
        const response = await apiRequest(`/api/facebook/search/groups?keyword=${encodeURIComponent(searchKeyword)}&limit=100`);
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
      const response = await apiRequest(`/api/group-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `groups_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/group-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-collection"] });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/group-collection"] });
  };

  const handleSearch = () => {
    if (searchKeyword.trim() || groupUrl.trim()) {
      searchMutation.mutate();
    }
  };

  const mockGroupData: GroupData[] = [
    {
      id: 1,
      keyword: "台北美食",
      city: "台北市",
      groupName: "台北美食愛好者聯盟",
      memberCount: 25600,
      groupLink: "https://facebook.com/groups/taipei.food.lovers",
      collectTime: "2024-12-06 23:30:15",
      isPublic: true,
      groupCategory: "美食與餐廳",
      description: "分享台北地區各種美食資訊"
    },
    {
      id: 2,
      keyword: "外送",
      city: "新北市",
      groupName: "新北外送員交流群",
      memberCount: 8900,
      groupLink: "https://facebook.com/groups/newtaipei.delivery",
      collectTime: "2024-12-06 23:28:42",
      isPublic: false,
      groupCategory: "工作與職業",
      description: "外送員工作經驗分享"
    }
  ];

  const displayData = groupData.length > 0 ? groupData : mockGroupData;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">指定社團採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              輸入關鍵字或社團連結進行採集
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">關鍵字</label>
                <Input
                  placeholder="輸入搜索關鍵字（如：台北美食、外送員）"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">社團連結</label>
                <Input
                  placeholder="輸入 Facebook 社團連結"
                  value={groupUrl}
                  onChange={(e) => setGroupUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || (!searchKeyword.trim() && !groupUrl.trim())}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
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
                  <TableHead className="text-gray-300">城市</TableHead>
                  <TableHead className="text-gray-300">社團名稱</TableHead>
                  <TableHead className="text-gray-300">成員數</TableHead>
                  <TableHead className="text-gray-300">社團連結</TableHead>
                  <TableHead className="text-gray-300">採集時間</TableHead>
                  <TableHead className="text-gray-300">公開/私密</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: GroupData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-purple-600 text-purple-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {item.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {item.groupName}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-300">
                        {item.memberCount.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={item.groupLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                        查看社團
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{item.collectTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.isPublic ? (
                          <>
                            <Unlock className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">公開</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-orange-400" />
                            <span className="text-orange-400">私密</span>
                          </>
                        )}
                      </div>
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