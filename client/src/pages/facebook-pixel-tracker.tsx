import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Target, 
  DollarSign, 
  Users, 
  BarChart3,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  Zap,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface PixelData {
  pixelId: string;
  pixelName: string;
  totalSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversionRate: number;
  roas: number;
  reach: number;
  frequency: number;
  audienceData: {
    ageGroups: { [key: string]: number };
    genders: { [key: string]: number };
    locations: { [key: string]: number };
    interests: string[];
  };
  campaigns: Array<{
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    status: string;
  }>;
  dateRange: {
    from: string;
    to: string;
  };
}

export default function FacebookPixelTracker() {
  const [pixelId, setPixelId] = useState("");
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPixelDataMutation = useMutation({
    mutationFn: async (pixelId: string) => {
      setIsLoading(true);
      return apiRequest('/api/facebook/pixel-data-fixed', {
        method: 'POST',
        data: { pixelId }
      });
    },
    onSuccess: (data: any) => {
      console.log('API Response:', data);
      if (data && data.pixelData) {
        setPixelData(data.pixelData);
        toast({
          title: "像素數據提取成功",
          description: `成功獲取像素 ${pixelId} 的廣告數據`,
        });
      } else {
        console.error('No pixelData in response:', data);
        toast({
          title: "數據格式錯誤",
          description: "API回應格式不正確",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('像素數據提取失敗:', error);
      toast({
        title: "提取失敗",
        description: "無法獲取像素數據，請檢查像素ID或API權限",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (format: string) => {
      return apiRequest('/api/facebook/export-pixel-data', {
        method: 'POST',
        data: { 
          pixelData,
          format 
        }
      });
    },
    onSuccess: (data: any) => {
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
      toast({
        title: "導出成功",
        description: "像素數據已成功導出",
      });
    },
    onError: (error) => {
      console.error('導出失敗:', error);
      toast({
        title: "導出失敗",
        description: "無法導出像素數據",
        variant: "destructive",
      });
    },
  });

  const handleFetchData = () => {
    if (!pixelId.trim()) {
      toast({
        title: "請輸入像素ID",
        description: "請輸入有效的Facebook像素ID",
        variant: "destructive",
      });
      return;
    }
    fetchPixelDataMutation.mutate(pixelId.trim());
  };

  const handleExport = (format: string) => {
    if (!pixelData) {
      toast({
        title: "沒有可導出的數據",
        description: "請先獲取像素數據",
        variant: "destructive",
      });
      return;
    }
    exportDataMutation.mutate(format);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 標題區 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Facebook 像素追蹤器</h1>
          <p className="text-blue-200">提取Facebook像素廣告數據和花費分析</p>
        </div>

        {/* 像素設置說明 */}
        <Alert className="bg-blue-900/20 border-blue-600">
          <Target className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-400">Facebook像素數據提取</AlertTitle>
          <AlertDescription className="text-blue-300">
            Facebook像素可以追蹤廣告效果、受眾行為和轉換數據。輸入您的像素ID即可獲取詳細的廣告花費和效果分析。
          </AlertDescription>
        </Alert>

        {/* 控制台 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              像素數據獲取
            </CardTitle>
            <CardDescription className="text-gray-300">
              輸入Facebook像素ID來獲取廣告數據和花費信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixelId" className="text-white">Facebook像素ID</Label>
              <Input
                id="pixelId"
                placeholder="例如: 1234567890123456"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-sm text-gray-400">
                在Facebook事件管理工具中可以找到您的像素ID
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleFetchData}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    獲取中...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    獲取像素數據
                  </>
                )}
              </Button>
              
              {pixelData && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleExport('json')}
                    disabled={exportDataMutation.isPending}
                    className="border-green-600 text-green-400 hover:bg-green-600/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    導出JSON
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleExport('csv')}
                    disabled={exportDataMutation.isPending}
                    className="border-green-600 text-green-400 hover:bg-green-600/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    導出CSV
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 數據概覽 */}
        {pixelData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-300">總花費</p>
                      <p className="text-2xl font-bold text-white">
                        ${pixelData.totalSpend.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-300">曝光次數</p>
                      <p className="text-2xl font-bold text-white">
                        {pixelData.impressions.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-300">點擊次數</p>
                      <p className="text-2xl font-bold text-white">
                        {pixelData.clicks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-300">轉換次數</p>
                      <p className="text-2xl font-bold text-white">
                        {pixelData.conversions.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 效果指標 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300 mb-1">點擊率 (CTR)</p>
                    <p className="text-xl font-bold text-blue-400">
                      {pixelData.ctr.toFixed(2)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300 mb-1">轉換率</p>
                    <p className="text-xl font-bold text-green-400">
                      {pixelData.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300 mb-1">廣告投資報酬率</p>
                    <p className="text-xl font-bold text-purple-400">
                      {pixelData.roas.toFixed(2)}x
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 廣告活動詳情 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">廣告活動明細</CardTitle>
                <CardDescription className="text-gray-300">
                  各個廣告活動的花費和效果詳情
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pixelData.campaigns.map((campaign, index) => (
                    <div key={campaign.id} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">{campaign.name}</h3>
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {campaign.status === 'active' ? '進行中' : '暫停'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">花費</p>
                          <p className="text-white font-medium">
                            ${campaign.spend.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">曝光</p>
                          <p className="text-white font-medium">
                            {campaign.impressions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">點擊</p>
                          <p className="text-white font-medium">
                            {campaign.clicks.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">轉換</p>
                          <p className="text-white font-medium">
                            {campaign.conversions.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 受眾分析 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">受眾洞察</CardTitle>
                <CardDescription className="text-gray-300">
                  基於像素數據的受眾分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* 年齡分布 */}
                  <div>
                    <h4 className="text-white font-medium mb-3">年齡分布</h4>
                    <div className="space-y-2">
                      {Object.entries(pixelData.audienceData.ageGroups).map(([age, percentage]) => (
                        <div key={age} className="flex justify-between items-center">
                          <span className="text-gray-300">{age}</span>
                          <span className="text-white">{percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 性別分布 */}
                  <div>
                    <h4 className="text-white font-medium mb-3">性別分布</h4>
                    <div className="space-y-2">
                      {Object.entries(pixelData.audienceData.genders).map(([gender, percentage]) => (
                        <div key={gender} className="flex justify-between items-center">
                          <span className="text-gray-300">
                            {gender === 'male' ? '男性' : gender === 'female' ? '女性' : '其他'}
                          </span>
                          <span className="text-white">{percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 地區分布 */}
                  <div>
                    <h4 className="text-white font-medium mb-3">主要地區</h4>
                    <div className="space-y-2">
                      {Object.entries(pixelData.audienceData.locations).slice(0, 5).map(([location, percentage]) => (
                        <div key={location} className="flex justify-between items-center">
                          <span className="text-gray-300">{location}</span>
                          <span className="text-white">{percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 興趣標籤 */}
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-3">受眾興趣</h4>
                  <div className="flex flex-wrap gap-2">
                    {pixelData.audienceData.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="border-blue-600 text-blue-400">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 空狀態 */}
        {!pixelData && !isLoading && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">開始分析像素數據</h3>
              <p className="text-gray-400 mb-6">輸入您的Facebook像素ID來獲取詳細的廣告花費和效果分析</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}