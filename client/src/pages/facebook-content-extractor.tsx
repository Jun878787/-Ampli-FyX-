import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Download, 
  FileText, 
  User, 
  Calendar,
  TrendingUp,
  Users,
  Target,
  Copy,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Info
} from "lucide-react";

interface ExtractedContent {
  id: string;
  title: string;
  content: string;
  type: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  author: string;
  publishedAt: string;
  url: string;
}

export default function FacebookContentExtractor() {
  const [pageUrl, setPageUrl] = useState("");
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const extractContentMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsExtracting(true);
      return apiRequest('/api/facebook/extract-page-content', {
        method: 'POST',
        data: { pageUrl: url }
      });
    },
    onSuccess: (data) => {
      setExtractedContents(data.contents || []);
      toast({
        title: "內容提取成功",
        description: `成功提取 ${data.contents?.length || 0} 個內容項目`,
      });
      setIsExtracting(false);
    },
    onError: (error) => {
      console.error('提取失敗:', error);
      toast({
        title: "提取失敗",
        description: "無法提取頁面內容，請檢查頁面URL或權限設定",
        variant: "destructive",
      });
      setIsExtracting(false);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (format: string) => {
      return apiRequest('/api/facebook/export-extracted-content', {
        method: 'POST',
        data: { 
          contents: extractedContents,
          format 
        }
      });
    },
    onSuccess: (data) => {
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
      toast({
        title: "導出成功",
        description: "內容已成功導出",
      });
    },
    onError: (error) => {
      console.error('導出失敗:', error);
      toast({
        title: "導出失敗",
        description: "無法導出內容數據",
        variant: "destructive",
      });
    },
  });

  const handleExtract = () => {
    if (!pageUrl.trim()) {
      toast({
        title: "請輸入頁面URL",
        description: "請輸入有效的Facebook頁面URL",
        variant: "destructive",
      });
      return;
    }
    extractContentMutation.mutate(pageUrl.trim());
  };

  const handleExport = (format: string) => {
    if (extractedContents.length === 0) {
      toast({
        title: "沒有可導出的內容",
        description: "請先提取一些內容",
        variant: "destructive",
      });
      return;
    }
    exportDataMutation.mutate(format);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已複製到剪貼板",
      description: "內容已複製到剪貼板",
    });
  };

  const totalEngagement = extractedContents.reduce((total, content) => {
    return total + content.engagement.likes + content.engagement.comments + content.engagement.shares;
  }, 0);

  const avgEngagement = extractedContents.length > 0 ? Math.round(totalEngagement / extractedContents.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 標題區 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Facebook 內容提取器</h1>
          <p className="text-blue-200">提取和分析Facebook頁面的公開內容</p>
        </div>

        {/* 使用說明 */}
        <Alert className="bg-blue-900/20 border-blue-600">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-400">功能說明</AlertTitle>
          <AlertDescription className="text-blue-300">
            此功能可以提取Facebook公開頁面的貼文內容、互動數據和基本分析。只需要提供頁面URL即可開始提取。
          </AlertDescription>
        </Alert>

        {/* 提取控制台 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              內容提取
            </CardTitle>
            <CardDescription className="text-gray-300">
              輸入Facebook頁面URL開始提取內容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageUrl" className="text-white">頁面URL</Label>
              <Input
                id="pageUrl"
                placeholder="https://www.facebook.com/your-page-name"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleExtract}
                disabled={isExtracting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExtracting ? (
                  <>提取中...</>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    開始提取
                  </>
                )}
              </Button>
              
              {extractedContents.length > 0 && (
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

        {/* 統計概覽 */}
        {extractedContents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-300">總內容數</p>
                    <p className="text-2xl font-bold text-white">{extractedContents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-300">總互動數</p>
                    <p className="text-2xl font-bold text-white">{totalEngagement.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-300">平均互動</p>
                    <p className="text-2xl font-bold text-white">{avgEngagement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-300">內容類型</p>
                    <p className="text-2xl font-bold text-white">
                      {new Set(extractedContents.map(c => c.type)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 內容列表 */}
        {extractedContents.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">提取的內容</CardTitle>
              <CardDescription className="text-gray-300">
                共 {extractedContents.length} 個內容項目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extractedContents.map((content, index) => (
                  <div key={content.id} className="bg-gray-700/30 rounded-lg p-4 space-y-3">
                    
                    {/* 內容頭部 */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-blue-600 text-blue-400">
                            {content.type}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {new Date(content.publishedAt).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                        
                        {content.title && (
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {content.title}
                          </h3>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(content.content)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600/20"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(content.url, '_blank')}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 內容預覽 */}
                    <div className="bg-gray-800/50 rounded p-3">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {content.content.length > 200 
                          ? `${content.content.substring(0, 200)}...` 
                          : content.content
                        }
                      </p>
                    </div>

                    {/* 互動數據 */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-red-400">
                        <Heart className="h-4 w-4" />
                        <span>{content.engagement.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-400">
                        <MessageCircle className="h-4 w-4" />
                        <span>{content.engagement.comments.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-400">
                        <Share className="h-4 w-4" />
                        <span>{content.engagement.shares.toLocaleString()}</span>
                      </div>
                      {content.engagement.views && (
                        <div className="flex items-center gap-1 text-purple-400">
                          <Eye className="h-4 w-4" />
                          <span>{content.engagement.views.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-400">
                        <User className="h-4 w-4" />
                        <span>{content.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 空狀態 */}
        {extractedContents.length === 0 && !isExtracting && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">還沒有提取的內容</h3>
              <p className="text-gray-400 mb-6">輸入Facebook頁面URL開始提取內容</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}