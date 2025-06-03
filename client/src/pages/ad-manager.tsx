import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BarChart3, TrendingUp, Eye, Users, MousePointer, DollarSign, Calendar, Target, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const adCampaignSchema = z.object({
  campaignName: z.string().min(1, "廣告活動名稱為必填"),
  objective: z.enum(["awareness", "traffic", "engagement", "leads", "conversions", "sales"]),
  targetAudience: z.object({
    ageRange: z.object({
      min: z.number().min(13).max(65),
      max: z.number().min(13).max(65),
    }),
    gender: z.enum(["all", "male", "female"]).default("all"),
    locations: z.array(z.string()).min(1, "請至少選擇一個地區"),
    interests: z.array(z.string()).optional(),
    behaviors: z.array(z.string()).optional(),
  }),
  budget: z.object({
    type: z.enum(["daily", "lifetime"]),
    amount: z.number().min(1, "預算金額必須大於0"),
    currency: z.enum(["TWD", "USD", "CNY", "JPY"]).default("TWD"),
  }),
  schedule: z.object({
    startDate: z.string().min(1, "開始日期為必填"),
    endDate: z.string().optional(),
    timeZone: z.string().default("Asia/Taipei"),
  }),
  creatives: z.object({
    format: z.enum(["image", "video", "carousel", "collection"]),
    headline: z.string().min(1, "標題為必填"),
    description: z.string().min(1, "描述為必填"),
    callToAction: z.enum(["learn_more", "shop_now", "sign_up", "contact_us", "download"]),
  }),
  isActive: z.boolean().default(true),
});

type AdCampaignForm = z.infer<typeof adCampaignSchema>;

export default function AdManager() {
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/facebook/ad-campaigns"],
  });

  const { data: adAnalytics = null, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/facebook/ad-analytics", selectedDateRange],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/facebook/accounts"],
  });

  const campaignForm = useForm<AdCampaignForm>({
    resolver: zodResolver(adCampaignSchema),
    defaultValues: {
      campaignName: "",
      objective: "awareness",
      targetAudience: {
        ageRange: { min: 18, max: 65 },
        gender: "all",
        locations: [],
        interests: [],
        behaviors: [],
      },
      budget: {
        type: "daily",
        amount: 100,
        currency: "TWD",
      },
      schedule: {
        startDate: "",
        endDate: "",
        timeZone: "Asia/Taipei",
      },
      creatives: {
        format: "image",
        headline: "",
        description: "",
        callToAction: "learn_more",
      },
      isActive: true,
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: AdCampaignForm) => {
      return await apiRequest("/api/facebook/ad-campaigns", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/ad-campaigns"] });
      setIsCampaignDialogOpen(false);
      campaignForm.reset();
    },
  });

  const onCreateCampaign = (data: AdCampaignForm) => {
    createCampaignMutation.mutate(data);
  };

  // 模擬廣告數據
  const mockAnalytics = {
    totalImpressions: 125847,
    totalClicks: 3256,
    totalSpend: 15420,
    totalConversions: 89,
    ctr: 2.59,
    cpc: 4.73,
    cpm: 122.5,
    conversionRate: 2.73,
    roas: 3.42,
  };

  const mockCampaigns = [
    {
      id: 1,
      campaignName: "北金國際品牌推廣",
      objective: "awareness",
      status: "active",
      impressions: 45632,
      clicks: 1258,
      spend: 5420,
      conversions: 34,
      ctr: 2.76,
      cpc: 4.31,
      startDate: "2024-06-01",
      endDate: "2024-06-30",
    },
    {
      id: 2,
      campaignName: "產品銷售轉換",
      objective: "conversions",
      status: "active",
      impressions: 32145,
      clicks: 892,
      spend: 4200,
      conversions: 28,
      ctr: 2.78,
      cpc: 4.71,
      startDate: "2024-06-01",
      endDate: "2024-06-15",
    },
    {
      id: 3,
      campaignName: "流量獲取活動",
      objective: "traffic",
      status: "paused",
      impressions: 28451,
      clicks: 756,
      spend: 3200,
      conversions: 15,
      ctr: 2.66,
      cpc: 4.23,
      startDate: "2024-05-15",
      endDate: "2024-05-31",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">廣告管理員</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook廣告投放與數據分析</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-100 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                <SelectItem value="1d">今天</SelectItem>
                <SelectItem value="7d">過去7天</SelectItem>
                <SelectItem value="30d">過去30天</SelectItem>
                <SelectItem value="90d">過去90天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 廣告數據總覽 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總曝光量</p>
                  <p className="text-2xl font-bold text-slate-100">{mockAnalytics.totalImpressions.toLocaleString()}</p>
                  <p className="text-green-400 text-sm">+12.5% vs 上週</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總點擊量</p>
                  <p className="text-2xl font-bold text-slate-100">{mockAnalytics.totalClicks.toLocaleString()}</p>
                  <p className="text-green-400 text-sm">+8.3% vs 上週</p>
                </div>
                <MousePointer className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總花費</p>
                  <p className="text-2xl font-bold text-slate-100">TWD {mockAnalytics.totalSpend.toLocaleString()}</p>
                  <p className="text-red-400 text-sm">+15.2% vs 上週</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">轉換次數</p>
                  <p className="text-2xl font-bold text-slate-100">{mockAnalytics.totalConversions}</p>
                  <p className="text-green-400 text-sm">+22.1% vs 上週</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 關鍵指標 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">點擊率 (CTR)</p>
                <p className="text-xl font-bold text-slate-100">{mockAnalytics.ctr}%</p>
                <Progress value={mockAnalytics.ctr * 10} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">每次點擊成本 (CPC)</p>
                <p className="text-xl font-bold text-slate-100">TWD {mockAnalytics.cpc}</p>
                <Progress value={75} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">每千次曝光成本 (CPM)</p>
                <p className="text-xl font-bold text-slate-100">TWD {mockAnalytics.cpm}</p>
                <Progress value={60} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">廣告投資回報率 (ROAS)</p>
                <p className="text-xl font-bold text-slate-100">{mockAnalytics.roas}x</p>
                <Progress value={mockAnalytics.roas * 20} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="campaigns" className="rounded-lg">廣告活動</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">數據分析</TabsTrigger>
            <TabsTrigger value="audiences" className="rounded-lg">受眾管理</TabsTrigger>
            <TabsTrigger value="creatives" className="rounded-lg">廣告素材</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">廣告活動管理</CardTitle>
                  <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        建立廣告活動
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-4xl rounded-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>建立新廣告活動</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          設定廣告目標、受眾、預算和素材
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...campaignForm}>
                        <form onSubmit={campaignForm.handleSubmit(onCreateCampaign)} className="space-y-6">
                          {/* 基本設定 */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-100">基本設定</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={campaignForm.control}
                                name="campaignName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">活動名稱</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="例：夏季促銷活動"
                                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={campaignForm.control}
                                name="objective"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">廣告目標</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                        <SelectItem value="awareness">品牌知名度</SelectItem>
                                        <SelectItem value="traffic">網站流量</SelectItem>
                                        <SelectItem value="engagement">參與互動</SelectItem>
                                        <SelectItem value="leads">潛在客戶</SelectItem>
                                        <SelectItem value="conversions">轉換</SelectItem>
                                        <SelectItem value="sales">銷售</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <Separator className="bg-slate-600" />

                          {/* 受眾設定 */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-100">目標受眾</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={campaignForm.control}
                                name="targetAudience.ageRange.min"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">最小年齡</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={13}
                                        max={65}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={campaignForm.control}
                                name="targetAudience.ageRange.max"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">最大年齡</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={13}
                                        max={65}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={campaignForm.control}
                                name="targetAudience.gender"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">性別</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                        <SelectItem value="all">所有</SelectItem>
                                        <SelectItem value="male">男性</SelectItem>
                                        <SelectItem value="female">女性</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <Separator className="bg-slate-600" />

                          {/* 預算設定 */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-100">預算與排程</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={campaignForm.control}
                                name="budget.type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">預算類型</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                        <SelectItem value="daily">每日預算</SelectItem>
                                        <SelectItem value="lifetime">總預算</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={campaignForm.control}
                                name="budget.amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">預算金額</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={1}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={campaignForm.control}
                                name="budget.currency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-slate-200">貨幣</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                        <SelectItem value="TWD">TWD</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="CNY">CNY</SelectItem>
                                        <SelectItem value="JPY">JPY</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCampaignDialogOpen(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                              取消
                            </Button>
                            <Button
                              type="submit"
                              disabled={createCampaignMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              {createCampaignMutation.isPending ? "建立中..." : "建立活動"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mockCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="bg-slate-700/50 border-slate-600 rounded-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-semibold text-slate-100 text-lg">{campaign.campaignName}</h3>
                              <Badge
                                variant={campaign.status === "active" ? "default" : "secondary"}
                                className={`rounded-md ${
                                  campaign.status === "active" 
                                    ? "bg-green-600 text-white" 
                                    : "bg-slate-600 text-slate-300"
                                }`}
                              >
                                {campaign.status === "active" ? "進行中" : "已暫停"}
                              </Badge>
                              <Badge variant="outline" className="border-slate-600 text-slate-300 rounded-md">
                                {campaign.objective}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                <p className="text-slate-400 text-sm">曝光量</p>
                                <p className="text-lg font-bold text-slate-100">{campaign.impressions.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                <p className="text-slate-400 text-sm">點擊量</p>
                                <p className="text-lg font-bold text-slate-100">{campaign.clicks.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                <p className="text-slate-400 text-sm">花費</p>
                                <p className="text-lg font-bold text-slate-100">TWD {campaign.spend.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                <p className="text-slate-400 text-sm">轉換</p>
                                <p className="text-lg font-bold text-slate-100">{campaign.conversions}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-slate-400">
                              <span>CTR: {campaign.ctr}%</span>
                              <span>CPC: TWD {campaign.cpc}</span>
                              <span>期間: {campaign.startDate} - {campaign.endDate}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                              <BarChart3 className="h-4 w-4 mr-1" />
                              分析
                            </Button>
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                              <Settings className="h-4 w-4 mr-1" />
                              編輯
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">效果趨勢圖</CardTitle>
                  <CardDescription className="text-slate-400">
                    過去30天的廣告效果變化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <TrendingUp className="h-12 w-12 mr-4" />
                    圖表功能開發中...
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">受眾分析</CardTitle>
                  <CardDescription className="text-slate-400">
                    目標受眾的人口統計和行為分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <Users className="h-12 w-12 mr-4" />
                    分析功能開發中...
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audiences">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">受眾管理</CardTitle>
                <CardDescription className="text-slate-400">
                  建立和管理自定義受眾、相似受眾
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  受眾管理功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creatives">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">廣告素材庫</CardTitle>
                <CardDescription className="text-slate-400">
                  管理圖片、影片和文案素材
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  素材管理功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}