import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Target, 
  Search, 
  Filter,
  TrendingUp,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  MousePointer,
  Download,
  Trash2
} from "lucide-react";

export default function EmploymentAnalytics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const queryClient = useQueryClient();

  // 獲取手動廣告數據
  const { data: manualAdData = [] } = useQuery({
    queryKey: ["/api/manual-ad-data"],
  });

  // 獲取就業廣告分析數據
  const { data: employmentAnalysis } = useQuery({
    queryKey: ["/api/employment/analysis"],
  });

  // 刪除廣告數據
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/manual-ad-data/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manual-ad-data"] });
    },
  });

  // 過濾廣告數據
  const filteredAds = manualAdData.filter((ad: any) => {
    const matchesSearch = !searchQuery || 
      ad.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.adTarget?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesJobType = jobTypeFilter === "all" || 
      (jobTypeFilter === "women" && (ad.adTarget?.includes("婦女") || ad.notes?.includes("婦女"))) ||
      (jobTypeFilter === "senior" && (ad.adTarget?.includes("中高齡") || ad.notes?.includes("中高齡")));

    const matchesLocation = locationFilter === "all" || 
      ad.location?.includes(locationFilter);

    return matchesSearch && matchesJobType && matchesLocation;
  });

  // 統計數據
  const womenJobAds = manualAdData.filter((ad: any) => 
    ad.adTarget?.includes("婦女") || ad.notes?.includes("婦女")
  ).length;

  const seniorJobAds = manualAdData.filter((ad: any) => 
    ad.adTarget?.includes("中高齡") || ad.notes?.includes("中高齡")
  ).length;

  const totalSpend = manualAdData.reduce((sum: number, ad: any) => sum + (ad.spend || 0), 0);
  const totalImpressions = manualAdData.reduce((sum: number, ad: any) => sum + (ad.impressions || 0), 0);

  // 地區分佈統計
  const locationStats = manualAdData.reduce((acc: any, ad: any) => {
    if (ad.location) {
      acc[ad.location] = (acc[ad.location] || 0) + 1;
    }
    return acc;
  }, {});

  // 年齡範圍統計
  const ageRangeStats = manualAdData.reduce((acc: any, ad: any) => {
    if (ad.ageRange) {
      acc[ad.ageRange] = (acc[ad.ageRange] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">就業廣告分析中心</h1>
            <p className="text-gray-300">專注於婦女就業與中高齡就業招募廣告分析</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              導出報告
            </Button>
          </div>
        </div>

        {/* 核心統計卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                婦女就業廣告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{womenJobAds}</div>
              <div className="text-xs text-gray-400">
                佔總廣告 {manualAdData.length > 0 ? Math.round((womenJobAds / manualAdData.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                中高齡就業廣告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{seniorJobAds}</div>
              <div className="text-xs text-gray-400">
                佔總廣告 {manualAdData.length > 0 ? Math.round((seniorJobAds / manualAdData.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                總廣告支出
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalSpend.toLocaleString()}</div>
              <div className="text-xs text-gray-400">
                {manualAdData.length} 個活動
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                總曝光次數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
              <div className="text-xs text-gray-400">
                平均每廣告 {manualAdData.length > 0 ? Math.round(totalImpressions / manualAdData.length).toLocaleString() : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 篩選控制面板 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              廣告篩選與搜尋
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">搜尋關鍵字</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋活動名稱、目標群體..."
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">就業類型</label>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有類型</SelectItem>
                    <SelectItem value="women">婦女就業</SelectItem>
                    <SelectItem value="senior">中高齡就業</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">地區</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有地區</SelectItem>
                    {Object.keys(locationStats).map(location => (
                      <SelectItem key={location} value={location}>
                        {location} ({locationStats[location]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setJobTypeFilter("all");
                    setLocationFilter("all");
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
                  清除篩選
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-600">廣告活動</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600">數據分析</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">策略洞察</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">就業招募廣告活動列表</CardTitle>
                <CardDescription className="text-gray-400">
                  找到 {filteredAds.length} 個符合條件的廣告活動
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">活動名稱</TableHead>
                      <TableHead className="text-gray-300">類型</TableHead>
                      <TableHead className="text-gray-300">目標群體</TableHead>
                      <TableHead className="text-gray-300">地區</TableHead>
                      <TableHead className="text-gray-300">花費</TableHead>
                      <TableHead className="text-gray-300">曝光數</TableHead>
                      <TableHead className="text-gray-300">點擊數</TableHead>
                      <TableHead className="text-gray-300">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad: any, index: number) => {
                      const isWomenJob = ad.adTarget?.includes("婦女") || ad.notes?.includes("婦女");
                      const isSeniorJob = ad.adTarget?.includes("中高齡") || ad.notes?.includes("中高齡");
                      
                      return (
                        <TableRow key={ad.id || index} className="border-gray-700">
                          <TableCell className="text-white font-medium">
                            {ad.campaignName || "未命名活動"}
                          </TableCell>
                          <TableCell>
                            {isWomenJob && <Badge variant="outline" className="bg-pink-900/30 text-pink-300 border-pink-600">婦女就業</Badge>}
                            {isSeniorJob && <Badge variant="outline" className="bg-orange-900/30 text-orange-300 border-orange-600">中高齡就業</Badge>}
                            {!isWomenJob && !isSeniorJob && <Badge variant="outline" className="border-gray-600 text-gray-300">一般職缺</Badge>}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {ad.adTarget || "未指定"}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ad.location || "未指定"}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            ${(ad.spend || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {(ad.impressions || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {(ad.clicks || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('確定要刪除此廣告活動嗎？')) {
                                  deleteAdMutation.mutate(ad.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">地區分佈</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(locationStats).map(([location, count]) => (
                      <div key={location} className="flex justify-between items-center">
                        <span className="text-gray-300">{location}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${(count as number / manualAdData.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">年齡範圍分佈</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(ageRangeStats).map(([ageRange, count]) => (
                      <div key={ageRange} className="flex justify-between items-center">
                        <span className="text-gray-300">{ageRange}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(count as number / manualAdData.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    婦女就業廣告建議
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-gray-300">
                    <div className="p-3 bg-pink-900/20 border border-pink-800 rounded-lg">
                      <h4 className="font-medium text-pink-300 mb-2">關鍵訊息重點</h4>
                      <ul className="text-sm space-y-1">
                        <li>• 強調彈性工作時間</li>
                        <li>• 突出友善職場環境</li>
                        <li>• 提及育兒支援政策</li>
                        <li>• 二度就業培訓機會</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-300 mb-2">適合職業類型</h4>
                      <ul className="text-sm space-y-1">
                        <li>• 行政助理、客服人員</li>
                        <li>• 門市服務、零售業</li>
                        <li>• 教育培訓、幼教相關</li>
                        <li>• 居家照護、美容保健</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    中高齡就業廣告建議
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-gray-300">
                    <div className="p-3 bg-orange-900/20 border border-orange-800 rounded-lg">
                      <h4 className="font-medium text-orange-300 mb-2">關鍵訊息重點</h4>
                      <ul className="text-sm space-y-1">
                        <li>• 重視經驗與穩定性</li>
                        <li>• 提供完整職前訓練</li>
                        <li>• 年齡友善工作環境</li>
                        <li>• 健康照護相關福利</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                      <h4 className="font-medium text-green-300 mb-2">適合職業類型</h4>
                      <ul className="text-sm space-y-1">
                        <li>• 保全、清潔服務</li>
                        <li>• 顧問、講師職位</li>
                        <li>• 社區服務、志工協調</li>
                        <li>• 手工藝、傳統技能</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}