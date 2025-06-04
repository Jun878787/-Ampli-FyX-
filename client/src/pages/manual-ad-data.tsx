import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, Target, MapPin, BarChart3, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdData {
  id?: number;
  campaignName: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  audience: {
    ageGroups: string[];
    genders: string[];
    locations: string[];
    interests: string[];
  };
  placements: string[];
  publishRegions: string[];
  adObjective: string;
  notes?: string;
}

export default function ManualAdData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<AdData>({
    campaignName: "",
    date: new Date().toISOString().split('T')[0],
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    audience: {
      ageGroups: [],
      genders: [],
      locations: [],
      interests: []
    },
    placements: [],
    publishRegions: [],
    adObjective: "",
    notes: ""
  });

  // 查詢廣告數據
  const { data: adDataList = [], isLoading } = useQuery({
    queryKey: ['/api/manual-ad-data'],
  });

  // 新增/更新廣告數據
  const saveAdDataMutation = useMutation({
    mutationFn: async (data: AdData) => {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/manual-ad-data/${editingId}` : '/api/manual-ad-data';
      const response = await apiRequest(url, { method, data });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-ad-data'] });
      resetForm();
      toast({
        title: editingId ? "數據已更新" : "數據已新增",
        description: "廣告數據已成功保存",
      });
    },
    onError: (error) => {
      toast({
        title: "保存失敗",
        description: "無法保存廣告數據，請重試",
        variant: "destructive",
      });
    }
  });

  // 刪除廣告數據
  const deleteAdDataMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/manual-ad-data/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manual-ad-data'] });
      toast({
        title: "數據已刪除",
        description: "廣告數據已成功刪除",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      campaignName: "",
      date: new Date().toISOString().split('T')[0],
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      audience: {
        ageGroups: [],
        genders: [],
        locations: [],
        interests: []
      },
      placements: [],
      publishRegions: [],
      adObjective: "",
      notes: ""
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (data: AdData) => {
    setFormData(data);
    setIsEditing(true);
    setEditingId(data.id || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdDataMutation.mutate(formData);
  };

  const handleArrayChange = (field: string, subField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        [subField]: value.split(',').map(item => item.trim()).filter(Boolean)
      }
    }));
  };

  const handleSimpleArrayChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  // 計算統計數據
  const stats = {
    totalSpend: adDataList.reduce((sum: number, item: any) => sum + (item.spend || 0), 0),
    totalImpressions: adDataList.reduce((sum: number, item: any) => sum + (item.impressions || 0), 0),
    totalClicks: adDataList.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0),
    totalConversions: adDataList.reduce((sum: number, item: any) => sum + (item.conversions || 0), 0),
    avgCTR: adDataList.length > 0 ? 
      adDataList.reduce((sum: number, item: any) => 
        sum + (item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0), 0) / adDataList.length : 0,
    avgCPC: adDataList.length > 0 ? 
      adDataList.reduce((sum: number, item: any) => 
        sum + (item.clicks > 0 ? item.spend / item.clicks : 0), 0) / adDataList.length : 0
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">手動廣告數據管理系統</h1>
          <p className="text-gray-400">追蹤和分析您的Facebook廣告表現數據</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">總花費</p>
                  <p className="text-xl font-bold text-white">${stats.totalSpend.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">總曝光</p>
                  <p className="text-xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">總點擊</p>
                  <p className="text-xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">總轉換</p>
                  <p className="text-xl font-bold text-white">{stats.totalConversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">平均CTR</p>
                  <p className="text-xl font-bold text-white">{stats.avgCTR.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">平均CPC</p>
                  <p className="text-xl font-bold text-white">${stats.avgCPC.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="input" className="data-[state=active]:bg-gray-700">數據輸入</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">歷史記錄</TabsTrigger>
          </TabsList>

          {/* 數據輸入表單 */}
          <TabsContent value="input">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {isEditing ? "編輯廣告數據" : "新增廣告數據"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* 基本信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campaignName" className="text-white">活動名稱</Label>
                      <Input
                        id="campaignName"
                        value={formData.campaignName}
                        onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="輸入活動名稱"
                        required
                      />
                    </div>

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
                  </div>

                  {/* 數據指標 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="spend" className="text-white">花費金額 ($)</Label>
                      <Input
                        id="spend"
                        type="number"
                        step="0.01"
                        value={formData.spend}
                        onChange={(e) => setFormData(prev => ({ ...prev, spend: parseFloat(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="impressions" className="text-white">曝光次數</Label>
                      <Input
                        id="impressions"
                        type="number"
                        value={formData.impressions}
                        onChange={(e) => setFormData(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="clicks" className="text-white">點擊次數</Label>
                      <Input
                        id="clicks"
                        type="number"
                        value={formData.clicks}
                        onChange={(e) => setFormData(prev => ({ ...prev, clicks: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="conversions" className="text-white">轉換次數</Label>
                      <Input
                        id="conversions"
                        type="number"
                        value={formData.conversions}
                        onChange={(e) => setFormData(prev => ({ ...prev, conversions: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* 廣告目標 */}
                  <div>
                    <Label htmlFor="adObjective" className="text-white">廣告目標</Label>
                    <Select value={formData.adObjective} onValueChange={(value) => setFormData(prev => ({ ...prev, adObjective: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="選擇廣告目標" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="awareness">品牌知名度</SelectItem>
                        <SelectItem value="traffic">網站流量</SelectItem>
                        <SelectItem value="engagement">互動率</SelectItem>
                        <SelectItem value="leads">潛在客戶</SelectItem>
                        <SelectItem value="conversions">轉換</SelectItem>
                        <SelectItem value="sales">銷售</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 受眾設定 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">受眾設定</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ageGroups" className="text-white">年齡群組</Label>
                        <Input
                          id="ageGroups"
                          value={formData.audience.ageGroups.join(', ')}
                          onChange={(e) => handleArrayChange('audience', 'ageGroups', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="18-24, 25-34, 35-44"
                        />
                      </div>

                      <div>
                        <Label htmlFor="genders" className="text-white">性別</Label>
                        <Input
                          id="genders"
                          value={formData.audience.genders.join(', ')}
                          onChange={(e) => handleArrayChange('audience', 'genders', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="男性, 女性, 全部"
                        />
                      </div>

                      <div>
                        <Label htmlFor="locations" className="text-white">地理位置</Label>
                        <Input
                          id="locations"
                          value={formData.audience.locations.join(', ')}
                          onChange={(e) => handleArrayChange('audience', 'locations', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="台灣, 香港, 新加坡"
                        />
                      </div>

                      <div>
                        <Label htmlFor="interests" className="text-white">興趣標籤</Label>
                        <Input
                          id="interests"
                          value={formData.audience.interests.join(', ')}
                          onChange={(e) => handleArrayChange('audience', 'interests', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="科技, 購物, 旅遊"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 版面選擇 */}
                  <div>
                    <Label htmlFor="placements" className="text-white">版面選擇</Label>
                    <Input
                      id="placements"
                      value={formData.placements.join(', ')}
                      onChange={(e) => handleSimpleArrayChange('placements', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Facebook動態, Instagram限時動態, Messenger"
                    />
                  </div>

                  {/* 發布地區 */}
                  <div>
                    <Label htmlFor="publishRegions" className="text-white">發布地區</Label>
                    <Input
                      id="publishRegions"
                      value={formData.publishRegions.join(', ')}
                      onChange={(e) => handleSimpleArrayChange('publishRegions', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="台灣, 香港, 新加坡, 馬來西亞"
                    />
                  </div>

                  {/* 備註 */}
                  <div>
                    <Label htmlFor="notes" className="text-white">備註</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="添加任何相關備註..."
                      rows={3}
                    />
                  </div>

                  {/* 提交按鈕 */}
                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={saveAdDataMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saveAdDataMutation.isPending ? "保存中..." : (isEditing ? "更新數據" : "保存數據")}
                    </Button>
                    
                    {isEditing && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={resetForm}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        取消編輯
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 歷史記錄 */}
          <TabsContent value="history">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  廣告數據歷史記錄
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">載入中...</div>
                  </div>
                ) : adDataList.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">尚未有任何廣告數據記錄</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adDataList.map((item: any) => (
                      <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{item.campaignName}</h3>
                            <p className="text-sm text-gray-400">{item.date}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAdDataMutation.mutate(item.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">花費:</span>
                            <span className="text-white ml-2">${item.spend}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">曝光:</span>
                            <span className="text-white ml-2">{item.impressions?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">點擊:</span>
                            <span className="text-white ml-2">{item.clicks?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">轉換:</span>
                            <span className="text-white ml-2">{item.conversions}</span>
                          </div>
                        </div>

                        <div className="mt-3 text-sm">
                          <div className="text-gray-400 mb-1">版面: <span className="text-white">{item.placements?.join(', ')}</span></div>
                          <div className="text-gray-400 mb-1">地區: <span className="text-white">{item.publishRegions?.join(', ')}</span></div>
                          {item.notes && (
                            <div className="text-gray-400">備註: <span className="text-white">{item.notes}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}