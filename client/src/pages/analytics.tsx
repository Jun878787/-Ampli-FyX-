import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, MessageSquare, Calendar, Download, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("all");

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["/api/analytics", selectedDateRange],
  });

  // 模擬分析數據
  const mockTrends = [
    { period: "本週", posts: 245, comments: 1280, engagement: 85.2, growth: 12.5 },
    { period: "上週", posts: 218, comments: 1156, engagement: 78.9, growth: 8.3 },
    { period: "本月", posts: 1024, comments: 5420, engagement: 82.1, growth: 15.2 },
    { period: "上月", posts: 890, comments: 4680, engagement: 79.3, growth: 11.8 },
  ];

  const mockTopSources = [
    { name: "Facebook 粉絲專頁", count: 2845, percentage: 45.2 },
    { name: "Facebook 群組", count: 1920, percentage: 30.5 },
    { name: "個人檔案", count: 980, percentage: 15.6 },
    { name: "Instagram", count: 540, percentage: 8.7 },
  ];

  const mockTopKeywords = [
    { keyword: "北金國際", mentions: 580, sentiment: "positive" },
    { keyword: "數據收集", mentions: 420, sentiment: "neutral" },
    { keyword: "Facebook", mentions: 380, sentiment: "positive" },
    { keyword: "自動化", mentions: 290, sentiment: "positive" },
    { keyword: "營銷", mentions: 245, sentiment: "neutral" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">數據分析</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook數據深度分析和洞察</p>
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
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新數據
            </Button>
          </div>
        </div>

        {/* 核心指標統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總數據量</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.totalCollected || 0}</p>
                  <p className="text-green-400 text-sm">+15.2% vs 上期</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">互動率</p>
                  <p className="text-2xl font-bold text-slate-100">82.1%</p>
                  <p className="text-green-400 text-sm">+3.8% vs 上期</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">活躍用戶</p>
                  <p className="text-2xl font-bold text-slate-100">1,247</p>
                  <p className="text-yellow-400 text-sm">+8.3% vs 上期</p>
                </div>
                <Users className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">平均回應時間</p>
                  <p className="text-2xl font-bold text-slate-100">2.3分</p>
                  <p className="text-green-400 text-sm">-12% vs 上期</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">總覽分析</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg">趨勢分析</TabsTrigger>
            <TabsTrigger value="sources" className="rounded-lg">來源分析</TabsTrigger>
            <TabsTrigger value="keywords" className="rounded-lg">關鍵字分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">數據收集趨勢</CardTitle>
                  <CardDescription className="text-slate-400">
                    過去30天的數據收集情況
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <TrendingUp className="h-12 w-12 mr-4" />
                    趨勢圖表功能開發中...
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">數據類型分布</CardTitle>
                  <CardDescription className="text-slate-400">
                    不同數據類型的收集比例
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">貼文內容</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-24" />
                        <span className="text-slate-400 text-sm">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">評論互動</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-24" />
                        <span className="text-slate-400 text-sm">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">用戶資料</span>
                      <div className="flex items-center gap-2">
                        <Progress value={10} className="w-24" />
                        <span className="text-slate-400 text-sm">10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">收集效率</CardTitle>
                  <CardDescription className="text-slate-400">
                    每小時平均收集數據量
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-100 mb-2">127</div>
                    <div className="text-slate-400">筆/小時</div>
                    <Badge className="mt-2 bg-green-600 text-white">效率優良</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100">品質評分</CardTitle>
                  <CardDescription className="text-slate-400">
                    數據完整性和準確性評估
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">完整性</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-24" />
                        <span className="text-slate-400 text-sm">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">準確性</span>
                      <div className="flex items-center gap-2">
                        <Progress value={88} className="w-24" />
                        <span className="text-slate-400 text-sm">88%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">新鮮度</span>
                      <div className="flex items-center gap-2">
                        <Progress value={95} className="w-24" />
                        <span className="text-slate-400 text-sm">95%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">趨勢分析報告</CardTitle>
                <CardDescription className="text-slate-400">
                  數據收集和互動趨勢的詳細分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTrends.map((trend, index) => (
                    <Card key={index} className="bg-slate-700/50 border-slate-600 rounded-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Calendar className="h-8 w-8 text-blue-400" />
                            <div>
                              <h3 className="font-semibold text-slate-100">{trend.period}</h3>
                              <p className="text-slate-400 text-sm">數據收集期間</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-6 text-center">
                            <div>
                              <p className="text-2xl font-bold text-slate-100">{trend.posts}</p>
                              <p className="text-slate-400 text-sm">貼文數</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-slate-100">{trend.comments}</p>
                              <p className="text-slate-400 text-sm">評論數</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-slate-100">{trend.engagement}%</p>
                              <p className="text-slate-400 text-sm">互動率</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-400">+{trend.growth}%</p>
                              <p className="text-slate-400 text-sm">成長率</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">數據來源分析</CardTitle>
                <CardDescription className="text-slate-400">
                  各個來源的數據收集情況統計
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100">{source.name}</h3>
                          <p className="text-slate-400 text-sm">{source.count} 筆數據</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={source.percentage} className="w-32" />
                        <span className="text-slate-300 font-medium">{source.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">關鍵字分析</CardTitle>
                <CardDescription className="text-slate-400">
                  熱門關鍵字和情感分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100">{keyword.keyword}</h3>
                          <p className="text-slate-400 text-sm">{keyword.mentions} 次提及</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant="outline"
                          className={`rounded-md ${
                            keyword.sentiment === "positive"
                              ? "border-green-600 text-green-300"
                              : keyword.sentiment === "negative"
                              ? "border-red-600 text-red-300"
                              : "border-yellow-600 text-yellow-300"
                          }`}
                        >
                          {keyword.sentiment === "positive" ? "正面" : 
                           keyword.sentiment === "negative" ? "負面" : "中性"}
                        </Badge>
                        <span className="text-slate-300 font-medium">{keyword.mentions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
