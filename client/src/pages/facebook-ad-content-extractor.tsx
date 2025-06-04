import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Filter, Eye, FileText, Image, Video, RefreshCw, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

export default function FacebookAdContentExtractor() {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 獲取廣告帳號
  const { data: adAccounts = [] } = useQuery({
    queryKey: ["/api/facebook/ad-accounts"],
  });

  // 獲取廣告活動
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/facebook/campaigns", selectedAccount],
  });

  // 獲取廣告內容
  const { data: adContents = [], isLoading: loadingContents } = useQuery({
    queryKey: ["/api/facebook/ad-contents", {
      accountId: selectedAccount,
      campaignId: selectedCampaign,
      contentType,
      searchQuery,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    }],
  });

  // 提取廣告內容
  const extractContentMutation = useMutation({
    mutationFn: async (filters: any) => {
      return await apiRequest("/api/facebook/extract-ad-contents", { method: "POST", data: filters });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/ad-contents"] });
      toast({
        title: "內容提取成功",
        description: "廣告內容已成功從Facebook API提取",
      });
    },
    onError: (error: any) => {
      toast({
        title: "提取失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 導出內容
  const exportContentMutation = useMutation({
    mutationFn: async (format: string) => {
      return await apiRequest(`/api/facebook/export-ad-contents?format=${format}`, { method: "GET" });
    },
    onSuccess: () => {
      toast({
        title: "導出成功",
        description: "廣告內容導出已開始",
      });
    },
  });

  // 模擬廣告內容數據
  const mockAdContents = [
    {
      id: 1,
      adId: "23849701321234567",
      campaignName: "北金品牌推廣",
      adsetName: "核心受眾",
      adName: "北金國際產品展示",
      headline: "北金國際 - 專業解決方案",
      primaryText: "發現北金國際的創新產品和服務，為您的業務帶來突破性增長。立即了解更多詳情。",
      description: "專業、可靠、創新 - 北金國際是您值得信賴的合作夥伴",
      callToAction: "了解更多",
      contentType: "single_image",
      imageUrl: "https://example.com/ad-image-1.jpg",
      videoUrl: null,
      linkUrl: "https://northsea.com/products",
      impressions: 125000,
      clicks: 2400,
      ctr: 1.92,
      cpc: 0.45,
      spend: 1080,
      createdAt: "2024-12-01",
      status: "ACTIVE",
      placement: ["facebook_feed", "instagram_feed"],
    },
    {
      id: 2,
      adId: "23849701321234568",
      campaignName: "產品銷售活動",
      adsetName: "再行銷受眾",
      adName: "限時優惠活動",
      headline: "限時85折優惠！",
      primaryText: "北金國際年末大促！全線產品85折優惠，限時3天。錯過再等一年！",
      description: "年末感恩回饋，品質保證，服務卓越",
      callToAction: "立即購買",
      contentType: "carousel",
      imageUrl: "https://example.com/ad-carousel-1.jpg",
      videoUrl: null,
      linkUrl: "https://northsea.com/sale",
      impressions: 89000,
      clicks: 3200,
      ctr: 3.60,
      cpc: 0.32,
      spend: 1024,
      createdAt: "2024-12-05",
      status: "ACTIVE",
      placement: ["facebook_feed", "instagram_stories"],
    },
    {
      id: 3,
      adId: "23849701321234569",
      campaignName: "品牌認知",
      adsetName: "興趣定向",
      adName: "企業文化視頻",
      headline: "了解北金國際",
      primaryText: "走進北金國際，了解我們的企業文化、團隊精神和創新理念。",
      description: "專業團隊，卓越服務，共創未來",
      callToAction: "觀看視頻",
      contentType: "video",
      imageUrl: "https://example.com/video-thumbnail-1.jpg",
      videoUrl: "https://example.com/company-video.mp4",
      linkUrl: "https://northsea.com/about",
      impressions: 156000,
      clicks: 1800,
      ctr: 1.15,
      cpc: 0.52,
      spend: 936,
      createdAt: "2024-11-28",
      status: "ACTIVE",
      placement: ["facebook_feed", "audience_network"],
    },
  ];

  const filteredContents = mockAdContents.filter(content => {
    const matchesSearch = !searchQuery || 
      content.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.primaryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesContentType = contentType === "all" || content.contentType === contentType;
    
    return matchesSearch && matchesContentType;
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "single_image": return <Image className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "carousel": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    const config = {
      single_image: { label: "圖片", variant: "default" as const },
      video: { label: "視頻", variant: "secondary" as const },
      carousel: { label: "輪播", variant: "outline" as const },
    };
    const { label, variant } = config[type as keyof typeof config] || config.single_image;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
        {status === "ACTIVE" ? "投放中" : "已暫停"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Facebook 廣告內容提取</h1>
            <p className="text-gray-300">提取和分析您的Facebook廣告創意內容</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => extractContentMutation.mutate({
                accountId: selectedAccount,
                campaignId: selectedCampaign,
                dateRange,
              })}
              disabled={extractContentMutation.isPending}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${extractContentMutation.isPending ? 'animate-spin' : ''}`} />
              提取最新內容
            </Button>
            <Button
              onClick={() => exportContentMutation.mutate('excel')}
              disabled={exportContentMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              導出內容
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">廣告帳號</label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="選擇帳號" />
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
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">廣告活動</label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="選擇活動" />
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
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">內容類型</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有類型</SelectItem>
                    <SelectItem value="single_image">單張圖片</SelectItem>
                    <SelectItem value="video">視頻</SelectItem>
                    <SelectItem value="carousel">輪播</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">開始日期</label>
                <Input
                  type="date"
                  value={format(dateRange.from, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    from: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">結束日期</label>
                <Input
                  type="date"
                  value={format(dateRange.to, "yyyy-MM-dd")}
                  onChange={(e) => setDateRange({
                    ...dateRange,
                    to: new Date(e.target.value)
                  })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">搜索關鍵詞</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索標題或內容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">總廣告數量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredContents.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">圖片廣告</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {filteredContents.filter(c => c.contentType === 'single_image').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">視頻廣告</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {filteredContents.filter(c => c.contentType === 'video').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">輪播廣告</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {filteredContents.filter(c => c.contentType === 'carousel').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">廣告內容列表</CardTitle>
            <CardDescription className="text-gray-400">
              點擊廣告查看詳細內容和效果數據
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">廣告信息</TableHead>
                  <TableHead className="text-gray-300">內容類型</TableHead>
                  <TableHead className="text-gray-300">標題</TableHead>
                  <TableHead className="text-gray-300">主要文本</TableHead>
                  <TableHead className="text-gray-300">效果數據</TableHead>
                  <TableHead className="text-gray-300">狀態</TableHead>
                  <TableHead className="text-gray-300">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingContents ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      載入中...
                    </TableCell>
                  </TableRow>
                ) : filteredContents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      暫無廣告內容，請調整篩選條件或提取最新內容
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContents.map((content) => (
                    <TableRow key={content.id} className="border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-white font-medium">{content.adName}</div>
                          <div className="text-xs text-gray-400">{content.campaignName}</div>
                          <div className="text-xs text-gray-500">ID: {content.adId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(content.contentType)}
                          {getContentTypeBadge(content.contentType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-white max-w-xs truncate">
                        {content.headline}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-md truncate">
                        {content.primaryText}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="text-gray-300">曝光: {content.impressions.toLocaleString()}</div>
                          <div className="text-gray-300">點擊: {content.clicks.toLocaleString()}</div>
                          <div className="text-gray-300">CTR: {content.ctr}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(content.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAd(content);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">廣告詳細內容</DialogTitle>
              <DialogDescription className="text-gray-400">
                查看完整的廣告創意內容和效果數據
              </DialogDescription>
            </DialogHeader>
            {selectedAd && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 基本信息 */}
                  <Card className="bg-gray-900/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">廣告名稱</label>
                        <div className="text-white">{selectedAd.adName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">廣告活動</label>
                        <div className="text-white">{selectedAd.campaignName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">廣告組</label>
                        <div className="text-white">{selectedAd.adsetName}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">內容類型</label>
                        <div className="flex items-center gap-2 mt-1">
                          {getContentTypeIcon(selectedAd.contentType)}
                          {getContentTypeBadge(selectedAd.contentType)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">投放版位</label>
                        <div className="flex gap-1 mt-1">
                          {selectedAd.placement.map((place: string) => (
                            <Badge key={place} variant="outline" className="text-xs">
                              {place.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 效果數據 */}
                  <Card className="bg-gray-900/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">效果數據</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">曝光數</label>
                          <div className="text-white text-lg font-semibold">
                            {selectedAd.impressions.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">點擊數</label>
                          <div className="text-white text-lg font-semibold">
                            {selectedAd.clicks.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">點擊率</label>
                          <div className="text-white text-lg font-semibold">{selectedAd.ctr}%</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">單次點擊成本</label>
                          <div className="text-white text-lg font-semibold">${selectedAd.cpc}</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">花費</label>
                          <div className="text-white text-lg font-semibold">${selectedAd.spend}</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">狀態</label>
                          <div className="mt-1">{getStatusBadge(selectedAd.status)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 創意內容 */}
                <Card className="bg-gray-900/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">創意內容</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">標題</label>
                      <div className="text-white text-lg font-medium mt-1">{selectedAd.headline}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">主要文本</label>
                      <Textarea
                        value={selectedAd.primaryText}
                        readOnly
                        className="mt-1 bg-gray-800 border-gray-600 text-white resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">描述</label>
                      <div className="text-white mt-1">{selectedAd.description}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">行動呼籲</label>
                      <Badge variant="secondary" className="mt-1">{selectedAd.callToAction}</Badge>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">連結網址</label>
                      <div className="text-blue-400 mt-1 break-all">{selectedAd.linkUrl}</div>
                    </div>
                    {selectedAd.imageUrl && (
                      <div>
                        <label className="text-sm text-gray-400">圖片</label>
                        <div className="mt-1 text-blue-400 break-all">{selectedAd.imageUrl}</div>
                      </div>
                    )}
                    {selectedAd.videoUrl && (
                      <div>
                        <label className="text-sm text-gray-400">視頻</label>
                        <div className="mt-1 text-blue-400 break-all">{selectedAd.videoUrl}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}