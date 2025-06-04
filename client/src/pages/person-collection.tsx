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
  User,
  MapPin,
  Clock,
  Link as LinkIcon,
  Avatar as AvatarIcon
} from "lucide-react";

interface PersonData {
  id: number;
  keyword: string;
  username: string;
  avatar: string;
  fbAccountLink: string;
  collectTime: string;
  city: string;
  followerCount?: number;
  profileType?: string;
  lastActive?: string;
}

export default function PersonCollection() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // 獲取人物採集數據
  const { data: personData = [], isLoading } = useQuery({
    queryKey: ["/api/person-collection", currentPage],
  });

  // 搜索人物
  const searchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/person-collection/search", {
        method: "POST",
        data: { 
          keyword: searchKeyword,
          profileUrl: profileUrl
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/person-collection"] });
    },
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      const response = await apiRequest(`/api/person-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `persons_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/person-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/person-collection"] });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/person-collection"] });
  };

  const handleSearch = () => {
    if (searchKeyword.trim() || profileUrl.trim()) {
      searchMutation.mutate();
    }
  };

  const mockPersonData: PersonData[] = [
    {
      id: 1,
      keyword: "外送員",
      username: "小王外送達人",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/delivery.wang",
      collectTime: "2024-12-06 23:30:15",
      city: "台北市",
      followerCount: 1200,
      profileType: "個人檔案",
      lastActive: "2024-12-06 22:15:30"
    },
    {
      id: 2,
      keyword: "美食blogger",
      username: "台北美食小編",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/taipei.foodie",
      collectTime: "2024-12-06 23:28:42",
      city: "台北市",
      followerCount: 8500,
      profileType: "創作者",
      lastActive: "2024-12-06 20:45:12"
    }
  ];

  const displayData = personData.length > 0 ? personData : mockPersonData;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-orange-400" />
          <h1 className="text-3xl font-bold text-white">指定人物採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              輸入關鍵字或個人檔案連結進行採集
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">關鍵字</label>
                <Input
                  placeholder="輸入搜索關鍵字（如：外送員、美食blogger）"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">個人檔案連結</label>
                <Input
                  placeholder="輸入 Facebook 個人檔案連結"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || (!searchKeyword.trim() && !profileUrl.trim())}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8"
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
              <User className="h-5 w-5" />
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
                {displayData.map((item: PersonData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-orange-600 text-orange-300">
                        {item.keyword}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {item.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AvatarIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-300 text-sm">頭像</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={item.fbAccountLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
                      >
                        <LinkIcon className="h-4 w-4" />
                        查看檔案
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{item.collectTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {item.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-300">
                        {item.followerCount?.toLocaleString() || 'N/A'}
                      </Badge>
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