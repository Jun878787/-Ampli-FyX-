import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  MapPin,
  User,
  Clock,
  Link as LinkIcon,
  Circle
} from "lucide-react";

interface RegionData {
  id: number;
  keyword: string;
  username: string;
  avatar: string;
  fbAccountLink: string;
  collectTime: string;
  region: string;
  city: string;
  followerCount?: number;
  profileType?: string;
}

const taiwanRegions = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市",
  "基隆市", "新竹市", "嘉義市",
  "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣", "嘉義縣",
  "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
];

export default function RegionCollection() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // 獲取地區採集數據
  const { data: regionData = [], isLoading } = useQuery({
    queryKey: ["/api/region-collection", currentPage],
  });

  // 搜索地區
  const searchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/region-collection/search", {
        method: "POST",
        data: { 
          keyword: searchKeyword,
          region: selectedRegion
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/region-collection"] });
    },
  });

  // 導出數據
  const exportMutation = useMutation({
    mutationFn: async (type: 'all' | 'current') => {
      const response = await apiRequest(`/api/region-collection/export?type=${type}`, {
        method: "GET",
      });
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `regions_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  // 清空數據
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/region-collection", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/region-collection"] });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/region-collection"] });
  };

  const handleSearch = () => {
    if (searchKeyword.trim() && selectedRegion) {
      searchMutation.mutate();
    }
  };

  const mockRegionData: RegionData[] = [
    {
      id: 1,
      keyword: "台北外送",
      username: "台北外送小哥",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/taipei.delivery.guy",
      collectTime: "2024-12-06 23:30:15",
      region: "台北市",
      city: "信義區",
      followerCount: 850,
      profileType: "個人檔案"
    },
    {
      id: 2,
      keyword: "高雄美食",
      username: "高雄美食達人",
      avatar: "https://via.placeholder.com/40",
      fbAccountLink: "https://facebook.com/kaohsiung.foodie",
      collectTime: "2024-12-06 23:28:42",
      region: "高雄市",
      city: "前金區",
      followerCount: 2400,
      profileType: "創作者"
    }
  ];

  const displayData = regionData.length > 0 ? regionData : mockRegionData;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-teal-400" />
          <h1 className="text-3xl font-bold text-white">指定地區採集</h1>
        </div>

        {/* 搜索區域 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">採集設定</CardTitle>
            <CardDescription className="text-gray-400">
              選擇台灣地區並輸入關鍵字進行採集
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">關鍵字</label>
                <Input
                  placeholder="輸入搜索關鍵字（如：台北外送、高雄美食）"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">台灣地區</label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="選擇台灣地區" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {taiwanRegions.map((region) => (
                      <SelectItem key={region} value={region} className="text-white hover:bg-gray-600">
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending || !searchKeyword.trim() || !selectedRegion}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
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
              <MapPin className="h-5 w-5" />
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
                  <TableHead className="text-gray-300">地區</TableHead>
                  <TableHead className="text-gray-300">追蹤者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item: RegionData) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell>
                      <Badge variant="outline" className="border-teal-600 text-teal-300">
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
                        <Circle className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-300 text-sm">頭像</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={item.fbAccountLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
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
                        <div className="flex flex-col">
                          <span className="font-medium">{item.region}</span>
                          <span className="text-xs text-gray-400">{item.city}</span>
                        </div>
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
                暫無採集數據，請選擇地區並輸入關鍵字開始採集
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