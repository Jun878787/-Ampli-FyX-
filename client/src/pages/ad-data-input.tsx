import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Users, Eye, MousePointer, UserPlus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DailyData {
  id?: number;
  campaignId: string;
  date: string;
  dailySpend: number;
  views: number;
  reach: number;
  interactions: number;
  followers: number;
}

export default function AdDataInput() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get campaign ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId') || '';
  const campaignName = urlParams.get('campaignName') || '未知活動';

  const [formData, setFormData] = useState<DailyData>({
    campaignId,
    date: new Date().toISOString().split('T')[0],
    dailySpend: 0,
    views: 0,
    reach: 0,
    interactions: 0,
    followers: 0,
  });

  // 獲取該活動的歷史數據
  const { data: historicalData = [], isLoading } = useQuery({
    queryKey: [`/api/ads/${campaignId}/data`],
    enabled: !!campaignId,
  });

  // 保存數據
  const saveDataMutation = useMutation({
    mutationFn: async (data: DailyData) => {
      const response = await apiRequest('/api/ads/data', { method: 'POST', data });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ads/${campaignId}/data`] });
      toast({
        title: "數據已保存",
        description: "您的廣告數據已成功保存",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "保存失敗",
        description: "無法保存廣告數據，請重試",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      campaignId,
      date: new Date().toISOString().split('T')[0],
      dailySpend: 0,
      views: 0,
      reach: 0,
      interactions: 0,
      followers: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDataMutation.mutate(formData);
  };

  const goBack = () => {
    setLocation('/facebook-ads-analytics');
  };

  // 計算統計數據
  const stats = {
    totalSpend: historicalData.reduce((sum: number, item: any) => sum + (item.dailySpend || 0), 0),
    totalViews: historicalData.reduce((sum: number, item: any) => sum + (item.views || 0), 0),
    totalReach: historicalData.reduce((sum: number, item: any) => sum + (item.reach || 0), 0),
    totalInteractions: historicalData.reduce((sum: number, item: any) => sum + (item.interactions || 0), 0),
    totalFollowers: historicalData.reduce((sum: number, item: any) => sum + (item.followers || 0), 0),
    avgCPM: historicalData.length > 0 ? 
      historicalData.reduce((sum: number, item: any) => 
        sum + (item.views > 0 ? (item.dailySpend / item.views) * 1000 : 0), 0) / historicalData.length : 0,
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 標題和返回按鈕 */}
        <div className="flex items-center gap-4">
          <Button
            onClick={goBack}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">數據輸入</h1>
            <p className="text-gray-400">活動：{campaignName}</p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">總花費</p>
                  <p className="text-xl font-bold text-white">NT${stats.totalSpend.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">瀏覽人數</p>
                  <p className="text-xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">觸及次數</p>
                  <p className="text-xl font-bold text-white">{stats.totalReach.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">互動次數</p>
                  <p className="text-xl font-bold text-white">{stats.totalInteractions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">追蹤人數</p>
                  <p className="text-xl font-bold text-white">{stats.totalFollowers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">平均CPM</p>
                  <p className="text-xl font-bold text-white">NT${stats.avgCPM.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 數據輸入表單 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">今日數據輸入</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <Label htmlFor="date" className="text-white">日期</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dailySpend" className="text-white">當日花費 (台幣)</Label>
                  <Input
                    id="dailySpend"
                    type="number"
                    value={formData.dailySpend}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailySpend: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="views" className="text-white">瀏覽人數</Label>
                  <Input
                    id="views"
                    type="number"
                    value={formData.views}
                    onChange={(e) => setFormData(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reach" className="text-white">觸及次數</Label>
                  <Input
                    id="reach"
                    type="number"
                    value={formData.reach}
                    onChange={(e) => setFormData(prev => ({ ...prev, reach: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="interactions" className="text-white">互動次數</Label>
                  <Input
                    id="interactions"
                    type="number"
                    value={formData.interactions}
                    onChange={(e) => setFormData(prev => ({ ...prev, interactions: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="followers" className="text-white">追蹤人數</Label>
                  <Input
                    id="followers"
                    type="number"
                    value={formData.followers}
                    onChange={(e) => setFormData(prev => ({ ...prev, followers: parseInt(e.target.value) || 0 }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="0"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={saveDataMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saveDataMutation.isPending ? "保存中..." : "保存數據"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    重置
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 歷史記錄 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">歷史記錄</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">載入中...</div>
                </div>
              ) : historicalData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">尚未有任何數據記錄</div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historicalData.map((item: any) => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-white">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-400">NT${item.dailySpend}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">瀏覽:</span>
                          <span className="text-white ml-1">{item.views?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">觸及:</span>
                          <span className="text-white ml-1">{item.reach?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">互動:</span>
                          <span className="text-white ml-1">{item.interactions?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">追蹤:</span>
                          <span className="text-white ml-1">{item.followers?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}