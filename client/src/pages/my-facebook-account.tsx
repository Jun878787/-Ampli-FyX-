import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Activity, TrendingUp, DollarSign, Users, Eye, MousePointer, Target, BarChart3, Calendar, Mail, Refresh } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  created_time: string;
  updated_time: string;
}

interface Ad {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  creative: {
    title: string;
    body: string;
    image_url: string;
  };
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  created_time: string;
}

interface ActivityLogItem {
  id: number;
  timestamp: string;
  action: string;
  details: string;
  campaign_id?: string;
  ad_id?: string;
  status: string;
}

export default function MyFacebookAccount() {
  const [refreshing, setRefreshing] = useState(false);

  // 獲取帳號基本信息
  const { data: accountData, refetch: refetchAccount } = useQuery({
    queryKey: ['/api/facebook/account-data'],
  });

  // 獲取廣告活動
  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ['/api/facebook/campaigns'],
  });

  // 獲取廣告
  const { data: ads = [], refetch: refetchAds } = useQuery<Ad[]>({
    queryKey: ['/api/facebook/ads'],
  });

  // 獲取洞察數據
  const { data: insights = [], refetch: refetchInsights } = useQuery({
    queryKey: ['/api/facebook/insights'],
  });

  // 獲取活動記錄
  const { data: activityLog = [], refetch: refetchActivity } = useQuery<ActivityLogItem[]>({
    queryKey: ['/api/facebook/activity-log'],
  });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAccount(),
        refetchCampaigns(),
        refetchAds(),
        refetchInsights(),
        refetchActivity()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // 計算總計數據
  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);
  const avgCTR = campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.ctr, 0) / campaigns.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">我的Facebook帳號</h1>
            <p className="text-gray-300 mt-1">
              帳號: {accountData?.email || 'nanaa.888080@Gmail.com'}
            </p>
          </div>
          <Button 
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Refresh className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新數據
          </Button>
        </div>

        {/* 概覽統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">總花費</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">NT$ {totalSpend.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">總曝光</CardTitle>
              <Eye className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">總點擊</CardTitle>
              <MousePointer className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">總轉換</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalConversions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">平均CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{avgCTR.toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要內容 */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="campaigns" className="text-white data-[state=active]:bg-blue-600">
              廣告活動 ({campaigns.length})
            </TabsTrigger>
            <TabsTrigger value="ads" className="text-white data-[state=active]:bg-blue-600">
              廣告 ({ads.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-white data-[state=active]:bg-blue-600">
              洞察數據
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-blue-600">
              活動記錄
            </TabsTrigger>
          </TabsList>

          {/* 廣告活動標籤 */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{campaign.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          目標: {campaign.objective} • 創建於: {new Date(campaign.created_time).toLocaleDateString('zh-TW')}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={campaign.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">日預算</p>
                        <p className="text-lg font-semibold text-white">NT$ {campaign.daily_budget}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">花費</p>
                        <p className="text-lg font-semibold text-white">NT$ {campaign.spend}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">曝光</p>
                        <p className="text-lg font-semibold text-white">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">點擊</p>
                        <p className="text-lg font-semibold text-white">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">CTR</p>
                        <p className="text-lg font-semibold text-white">{campaign.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">CPM</p>
                        <p className="text-lg font-semibold text-white">NT$ {campaign.cpm}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 廣告標籤 */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid gap-4">
              {ads.map((ad) => (
                <Card key={ad.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{ad.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          廣告創意: {ad.creative.title}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={ad.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={ad.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {ad.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-300">{ad.creative.body}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">花費</p>
                          <p className="text-lg font-semibold text-white">NT$ {ad.spend}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">曝光</p>
                          <p className="text-lg font-semibold text-white">{ad.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">點擊</p>
                          <p className="text-lg font-semibold text-white">{ad.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">轉換</p>
                          <p className="text-lg font-semibold text-green-400">{ad.conversions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">CTR</p>
                          <p className="text-lg font-semibold text-white">{ad.ctr}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">CPC</p>
                          <p className="text-lg font-semibold text-white">NT$ {ad.cpc}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 洞察數據標籤 */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              {insights.map((insight: any, index: number) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      {insight.date}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">花費</p>
                        <p className="text-lg font-semibold text-white">NT$ {insight.spend}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">觸及</p>
                        <p className="text-lg font-semibold text-white">{insight.reach?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">頻率</p>
                        <p className="text-lg font-semibold text-white">{insight.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">轉換成本</p>
                        <p className="text-lg font-semibold text-white">NT$ {insight.cost_per_conversion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">受眾</p>
                        <p className="text-sm text-gray-300">{insight.audience?.age_range} • {insight.audience?.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 活動記錄標籤 */}
          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-3">
              {activityLog.map((log) => (
                <Card key={log.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium">{log.action}</h4>
                          <Badge 
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{log.details}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(log.timestamp).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}