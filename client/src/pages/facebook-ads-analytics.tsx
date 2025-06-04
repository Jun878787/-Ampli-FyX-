import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BarChart3, TrendingUp, DollarSign, Eye, Users, Target, Calendar, Download, RefreshCw, Filter, Search, FileSpreadsheet, MessageSquare, Plus, MousePointer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";

export default function FacebookAdsAnalytics() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const goToAdCreation = () => {
    setLocation('/ad-creation');
  };

  const goToDataInput = (campaignId: string, campaignName: string) => {
    setLocation(`/ad-data-input?campaignId=${campaignId}&campaignName=${encodeURIComponent(campaignName)}`);
  };

  // 獲取廣告帳號數據
  const { data: adAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["/api/facebook/ad-accounts"],
  });

  // 獲取廣告活動數據
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["/api/facebook/campaigns", selectedAccount],
  });

  // 獲取廣告分析數據
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["/api/facebook/ads-analytics", {
      accountId: selectedAccount,
      campaignId: selectedCampaign,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    }],
  });

  // 獲取廣告效果數據
  const { data: performanceData } = useQuery({
    queryKey: ["/api/facebook/ads-performance", selectedAccount],
  });

  // 獲取手動廣告數據
  const { data: manualAdData = [], isLoading: loadingManualAds } = useQuery({
    queryKey: ["/api/manual-ad-data"],
  });

  // 刷新數據
  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/facebook/refresh-ads-data", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook"] });
      toast({
        title: "數據更新成功",
        description: "廣告數據已從Facebook API更新",
      });
    },
    onError: (error: any) => {
      toast({
        title: "數據更新失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 導出數據
  const exportDataMutation = useMutation({
    mutationFn: async (format: string) => {
      return await apiRequest(`/api/facebook/export-ads-data?format=${format}`, { method: "GET" });
    },
    onSuccess: () => {
      toast({
        title: "導出成功",
        description: "廣告數據導出已開始",
      });
    },
  });

  // 刪除廣告活動
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/manual-ad-data/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-ad-data'] });
      toast({
        title: "廣告活動已刪除",
        description: "廣告活動已成功刪除",
      });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "無法刪除廣告活動，請重試",
        variant: "destructive",
      });
    }
  });

  // 計算真實數據統計
  const calculateOverviewStats = () => {
    if (!manualAdData.length) return null;
    
    const totalSpend = manualAdData.reduce((sum, ad) => sum + (ad.spend || 0), 0);
    const totalImpressions = manualAdData.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
    const totalClicks = manualAdData.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
    const totalConversions = manualAdData.reduce((sum, ad) => sum + (ad.conversions || 0), 0);
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const cpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions * 1000) : 0;
    
    return {
      totalSpend: totalSpend.toFixed(2),
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr: ctr.toFixed(2),
      cpc: cpc.toFixed(2),
      cpm: cpm.toFixed(2),
    };
  };

  const overviewStats = calculateOverviewStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Facebook 廣告數據分析</h1>
            <p className="text-gray-300">實時監控和分析您的Facebook廣告效果</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refreshDataMutation.mutate()}
              disabled={refreshDataMutation.isPending}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
              刷新數據
            </Button>
            <Button 
              onClick={goToAdCreation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              創建廣告
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">篩選條件:</span>
              </div>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="選擇廣告帳號" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有帳號</SelectItem>
                  {adAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="選擇廣告活動" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有活動</SelectItem>
                  {campaigns.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={format(dateRange.from, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    from: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white w-40"
                />
                <span className="text-gray-400">到</span>
                <Input
                  type="date"
                  value={format(dateRange.to, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    to: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                總花費
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${overviewStats ? parseFloat(overviewStats.totalSpend).toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-400">
                {manualAdData.length} 個活動
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                總曝光數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewStats ? overviewStats.totalImpressions.toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-400">
                曝光數據統計
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                總點擊數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewStats ? overviewStats.totalClicks.toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-400">
                CTR: {overviewStats ? overviewStats.ctr : '0'}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                總轉換數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {overviewStats ? overviewStats.totalConversions.toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-400">
                轉換數據統計
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">點擊率 (CTR)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">{overviewStats ? overviewStats.ctr : '0'}%</div>
              <Progress value={overviewStats ? parseFloat(overviewStats.ctr) * 10 : 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">單次點擊成本 (CPC)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">${overviewStats ? overviewStats.cpc : '0'}</div>
              <Progress value={50} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">千次曝光成本 (CPM)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">${overviewStats ? overviewStats.cpm : '0'}</div>
              <Progress value={50} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">廣告支出回報率 (ROAS)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">計算中</div>
              <Progress value={84} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="trends" className="data-[state=active]:bg-gray-700">
              趨勢分析
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-gray-700">
              活動效果
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-gray-700">
              受眾洞察
            </TabsTrigger>
            <TabsTrigger value="ad-details" className="data-[state=active]:bg-gray-700">
              廣告詳情
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">趨勢分析</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">每日花費趨勢</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                        }}
                      />
                      <Line type="monotone" dataKey="spend" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">曝光與點擊趨勢</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                        }}
                      />
                      <Area type="monotone" dataKey="impressions" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="clicks" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">活動效果比較</CardTitle>
                <CardDescription className="text-gray-400">
                  各廣告活動的花費和轉換表現
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">活動名稱</TableHead>
                      <TableHead className="text-gray-300">花費</TableHead>
                      <TableHead className="text-gray-300">曝光數</TableHead>
                      <TableHead className="text-gray-300">點擊數</TableHead>
                      <TableHead className="text-gray-300">轉換數</TableHead>
                      <TableHead className="text-gray-300">ROAS</TableHead>
                      <TableHead className="text-gray-300">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 顯示手動廣告數據 */}
                    {manualAdData.map((campaign, index) => (
                      <TableRow 
                        key={`manual-${campaign.id}`} 
                        className="border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                        onClick={() => goToDataInput(`manual-${campaign.id}`, campaign.campaignName)}
                      >
                        <TableCell className="text-white font-medium flex items-center gap-2">
                          {campaign.campaignName}
                          <Badge variant="outline" className="ml-2 text-xs">新建</Badge>
                          <MousePointer className="h-4 w-4 text-gray-400" />
                        </TableCell>
                        <TableCell className="text-gray-300">${(campaign.spend || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-gray-300">{(campaign.impressions || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-gray-300">{(campaign.clicks || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-gray-300">{campaign.conversions || 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            待更新
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('確定要刪除此廣告活動嗎？')) {
                                deleteAdMutation.mutate(campaign.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* 如果沒有手動廣告數據則顯示提示 */}
                    {manualAdData.length === 0 && (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          尚未建立廣告活動
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">年齡分佈</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ age, percentage }) => `${age}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {[]}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">受眾表現分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-gray-400 py-8">
                      尚無受眾數據
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ad-details" className="space-y-4">
            <AdContentExtractor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 廣告內容提取組件 - 嵌入到廣告分析頁面
function AdContentExtractor() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [contentType, setContentType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 獲取廣告帳號
  const { data: adAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["/api/facebook/ad-accounts"],
  });

  // 獲取廣告活動
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["/api/facebook/campaigns", selectedAccount],
  });

  // 獲取廣告內容
  const { data: adContents = [], isLoading: loadingAdContents } = useQuery({
    queryKey: ["/api/facebook/ad-contents", {
      accountId: selectedAccount,
      campaignId: selectedCampaign,
      contentType,
      searchQuery,
      dateRange: {
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd")
      }
    }],
  });

  // 提取廣告內容
  const extractContentsMutation = useMutation({
    mutationFn: async (params: any) => {
      return await apiRequest("/api/facebook/extract-ad-contents", {
        method: "POST",
        data: params
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/ad-contents"] });
      toast({
        title: "提取成功",
        description: "廣告內容已成功提取並分析",
      });
    },
    onError: (error: any) => {
      toast({
        title: "提取失敗",
        description: error.message || "提取廣告內容時發生錯誤",
        variant: "destructive",
      });
    },
  });

  // 導出數據
  const exportDataMutation = useMutation({
    mutationFn: async (format: string) => {
      return await apiRequest(`/api/facebook/export-ad-contents?format=${format}`, {
        method: "GET",
      });
    },
    onSuccess: (data) => {
      // 創建下載鏈接
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `fb_ad_contents_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "導出成功",
        description: `廣告內容數據已導出為 ${format.toUpperCase()} 格式`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "導出失敗",
        description: error.message || "導出數據時發生錯誤",
        variant: "destructive",
      });
    },
  });

  const handleExtractContents = () => {
    extractContentsMutation.mutate({
      accountId: selectedAccount !== "all" ? selectedAccount : undefined,
      campaignId: selectedCampaign !== "all" ? selectedCampaign : undefined,
      contentType: contentType !== "all" ? contentType : undefined,
      searchQuery: searchQuery || undefined,
      dateRange
    });
  };

  const handleExportData = (format: string) => {
    exportDataMutation.mutate(format);
  };

  const handleViewDetails = (ad: any) => {
    setSelectedAd(ad);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 篩選控制面板 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            廣告內容提取與分析
          </CardTitle>
          <CardDescription className="text-gray-400">
            提取並分析Facebook廣告的詳細內容，包括文章標題、內容、花費、受眾分析等
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 廣告帳號選擇 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">廣告帳號</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="選擇廣告帳號" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">所有帳號</SelectItem>
                  {Array.isArray(adAccounts) && adAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 廣告活動選擇 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">廣告活動</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="選擇廣告活動" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">所有活動</SelectItem>
                  {Array.isArray(campaigns) && campaigns.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 內容類型選擇 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">內容類型</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="選擇內容類型" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">所有類型</SelectItem>
                  <SelectItem value="image">圖片廣告</SelectItem>
                  <SelectItem value="video">影片廣告</SelectItem>
                  <SelectItem value="carousel">輪播廣告</SelectItem>
                  <SelectItem value="collection">精選集廣告</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 搜索查詢 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">關鍵詞搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索廣告內容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* 日期範圍和操作按鈕 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">日期範圍:</span>
                <Input
                  type="date"
                  value={format(dateRange.from, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    from: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white w-40"
                />
                <span className="text-gray-400">至</span>
                <Input
                  type="date"
                  value={format(dateRange.to, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    to: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white w-40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExtractContents}
                disabled={extractContentsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {extractContentsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    提取中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    提取內容
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleExportData("xlsx")}
                disabled={exportDataMutation.isPending}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {exportDataMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    導出中...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    導出Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 廣告內容數據表格 */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">廣告內容分析結果</CardTitle>
          <CardDescription className="text-gray-400">
            找到 {Array.isArray(adContents) ? adContents.length : 0} 條廣告內容記錄
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAdContents ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">載入廣告內容中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">文章標題</TableHead>
                    <TableHead className="text-gray-300">內容類型</TableHead>
                    <TableHead className="text-gray-300">花費</TableHead>
                    <TableHead className="text-gray-300">曝光數</TableHead>
                    <TableHead className="text-gray-300">點擊數</TableHead>
                    <TableHead className="text-gray-300">CTR</TableHead>
                    <TableHead className="text-gray-300">質量分數</TableHead>
                    <TableHead className="text-gray-300">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(adContents) && adContents.map((ad: any, index: number) => (
                    <TableRow key={index} className="border-gray-700">
                      <TableCell className="text-white font-medium max-w-xs truncate">
                        {ad.headline || ad.title || "未知標題"}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {ad.contentType || "圖片"}
                        </Badge>
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
                      <TableCell className="text-gray-300">
                        {((ad.clicks || 0) / (ad.impressions || 1) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            (ad.qualityScore || 0) >= 80 ? "default" : 
                            (ad.qualityScore || 0) >= 60 ? "secondary" : "destructive"
                          }
                        >
                          {ad.qualityScore || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(ad)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          查看詳情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}