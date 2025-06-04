import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Target, Users, MapPin, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdCreationData {
  campaignName: string;
  dailyBudget: number;
  adObjective: string;
  ageRange: {
    min: string;
    max: string;
  };
  gender: string;
  regions: string[];
  audienceTags: string[];
  placements: string[];
  notes: string;
}

const AD_OBJECTIVES = [
  { value: "awareness", label: "品牌知名度" },
  { value: "traffic", label: "網站流量" },
  { value: "engagement", label: "互動率" },
  { value: "leads", label: "潛在客戶" },
  { value: "conversions", label: "轉換" },
  { value: "sales", label: "銷售" },
];

const AGE_RANGES = [
  "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43",
  "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56",
  "57", "58", "59", "60", "61", "62", "63", "64", "65+"
];

const GENDERS = [
  { value: "all", label: "全部" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
];

const REGIONS = [
  // 主要區域
  { value: "north", label: "北部" },
  { value: "central", label: "中部" },
  { value: "south", label: "南部" },
  // 縣市選項
  { value: "taipei", label: "台北市" },
  { value: "new_taipei", label: "新北市" },
  { value: "taoyuan", label: "桃園市" },
  { value: "taichung", label: "台中市" },
  { value: "tainan", label: "台南市" },
  { value: "kaohsiung", label: "高雄市" },
  { value: "hsinchu_county", label: "新竹縣" },
  { value: "hsinchu_city", label: "新竹市" },
  { value: "miaoli", label: "苗栗縣" },
  { value: "changhua", label: "彰化縣" },
  { value: "nantou", label: "南投縣" },
  { value: "yunlin", label: "雲林縣" },
  { value: "chiayi_county", label: "嘉義縣" },
  { value: "chiayi_city", label: "嘉義市" },
  { value: "pingtung", label: "屏東縣" },
  { value: "yilan", label: "宜蘭縣" },
  { value: "hualien", label: "花蓮縣" },
  { value: "taitung", label: "台東縣" },
  { value: "penghu", label: "澎湖縣" },
  { value: "kinmen", label: "金門縣" },
  { value: "lienchiang", label: "連江縣" }
];

const PLACEMENTS = [
  { value: "facebook_feeds", label: "Facebook動態消息" },
  { value: "instagram_feeds", label: "Instagram動態消息" },
  { value: "instagram_stories", label: "Instagram限時動態" },
  { value: "facebook_stories", label: "Facebook限時動態" },
  { value: "messenger", label: "Messenger" },
  { value: "audience_network", label: "Audience Network" },
];

export default function AdCreation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<AdCreationData>({
    campaignName: "",
    dailyBudget: 0,
    adObjective: "",
    ageRange: {
      min: "",
      max: "",
    },
    gender: "",
    regions: [],
    audienceTags: [],
    placements: [],
    notes: "",
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: AdCreationData) => {
      const response = await apiRequest('/api/ads/create', { method: 'POST', data });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({
        title: "廣告已創建",
        description: "您的廣告活動已成功創建",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "創建失敗",
        description: "無法創建廣告活動，請重試",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      campaignName: "",
      dailyBudget: 0,
      adObjective: "",
      ageRange: {
        min: "",
        max: "",
      },
      gender: "",
      regions: [],
      audienceTags: [],
      placements: [],
      notes: "",
    });
  };

  const handleRegionToggle = (regionValue: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(regionValue)
        ? prev.regions.filter(r => r !== regionValue)
        : [...prev.regions, regionValue]
    }));
  };

  const handlePlacementToggle = (placementValue: string) => {
    setFormData(prev => ({
      ...prev,
      placements: prev.placements.includes(placementValue)
        ? prev.placements.filter(p => p !== placementValue)
        : [...prev.placements, placementValue]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdMutation.mutate(formData);
  };

  const handleAgeRangeChange = (field: 'min' | 'max', value: string) => {
    setFormData(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Plus className="h-8 w-8" />
            創建廣告
          </h1>
          <p className="text-gray-400">設定您的Facebook廣告活動</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 活動基本信息 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  活動基本信息
                </h2>
                
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
                    <Label htmlFor="dailyBudget" className="text-white">每日花費金額 (台幣)</Label>
                    <Input
                      id="dailyBudget"
                      type="number"
                      value={formData.dailyBudget}
                      onChange={(e) => setFormData(prev => ({ ...prev, dailyBudget: parseFloat(e.target.value) || 0 }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adObjective" className="text-white">廣告目標</Label>
                  <Select value={formData.adObjective} onValueChange={(value) => setFormData(prev => ({ ...prev, adObjective: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="選擇廣告目標" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {AD_OBJECTIVES.map((objective) => (
                        <SelectItem key={objective.value} value={objective.value}>
                          {objective.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 受眾設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  受眾設定
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white">年齡範圍</Label>
                    <div className="flex items-center gap-2">
                      <Select value={formData.audience.ageMin} onValueChange={(value) => handleAudienceChange('ageMin', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="最小" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {AGE_RANGES.map((age) => (
                            <SelectItem key={age} value={age}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-white">-</span>
                      <Select value={formData.audience.ageMax} onValueChange={(value) => handleAudienceChange('ageMax', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="最大" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {AGE_RANGES.map((age) => (
                            <SelectItem key={age} value={age}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">性別</Label>
                    <Select value={formData.audience.gender} onValueChange={(value) => handleAudienceChange('gender', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="選擇性別" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {GENDERS.map((gender) => (
                          <SelectItem key={gender.value} value={gender.value}>
                            {gender.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">地區</Label>
                    <Select value={formData.audience.location} onValueChange={(value) => handleAudienceChange('location', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="選擇地區" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {TAIWAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="interests" className="text-white">受眾標籤</Label>
                  <Input
                    id="interests"
                    value={formData.audience.interests}
                    onChange={(e) => handleAudienceChange('interests', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="例如：科技、購物、旅遊（用逗號分隔）"
                  />
                </div>
              </div>

              {/* 版面設定 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  版面設定
                </h2>
                
                <div>
                  <Label className="text-white">版面</Label>
                  <Select value={formData.placement} onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="選擇廣告版面" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {PLACEMENTS.map((placement) => (
                        <SelectItem key={placement.value} value={placement.value}>
                          {placement.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  rows={4}
                />
              </div>

              {/* 提交按鈕 */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={createAdMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createAdMutation.isPending ? "創建中..." : "創建廣告"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  重置表單
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}