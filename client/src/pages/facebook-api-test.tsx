import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Loader2, TestTube, Search, User, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FacebookApiTest() {
  const [pageId, setPageId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState("");
  const { toast } = useToast();

  // API Connection Test
  const { data: connectionTest, isLoading: isTestingConnection, refetch: testConnection } = useQuery({
    queryKey: ["/api/facebook/test"],
    enabled: false,
  });

  // Token Validation
  const { data: tokenValidation, isLoading: isValidatingToken, refetch: validateToken } = useQuery({
    queryKey: ["/api/facebook/validate-token"],
    enabled: false,
  });

  // User Info Test
  const userInfoMutation = useMutation({
    mutationFn: async (targetUserId?: string) => {
      const endpoint = targetUserId ? `/api/facebook/user/${targetUserId}` : "/api/facebook/user";
      return await apiRequest(endpoint);
    },
    onSuccess: (data) => {
      toast({
        title: "用戶信息獲取成功",
        description: "Facebook用戶數據已成功獲取",
      });
    },
    onError: (error) => {
      toast({
        title: "用戶信息獲取失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Page Info Test
  const pageInfoMutation = useMutation({
    mutationFn: async (targetPageId: string) => {
      return await apiRequest(`/api/facebook/page/${targetPageId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "頁面信息獲取成功",
        description: "Facebook頁面數據已成功獲取",
      });
    },
    onError: (error) => {
      toast({
        title: "頁面信息獲取失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Page Search Test
  const pageSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest(`/api/facebook/search/pages?q=${encodeURIComponent(query)}&limit=10`);
    },
    onSuccess: (data) => {
      toast({
        title: "頁面搜索成功",
        description: `找到 ${data.data?.count || 0} 個結果`,
      });
    },
    onError: (error) => {
      toast({
        title: "頁面搜索失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renderStatus = (success?: boolean) => {
    if (success === undefined) return <Badge variant="outline">未測試</Badge>;
    return success ? (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        成功
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        失敗
      </Badge>
    );
  };

  const renderJsonResponse = (data: any) => {
    if (!data) return null;
    return (
      <Textarea
        value={JSON.stringify(data, null, 2)}
        readOnly
        className="mt-2 h-32 font-mono text-sm bg-gray-950 text-green-400 border-gray-700"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <TestTube className="w-8 h-8 text-blue-400" />
            Facebook Graph API 測試中心
          </h1>
          <p className="text-gray-300">測試和驗證您的Facebook Graph API密鑰功能</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Connection Tests */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                基礎連接測試
              </CardTitle>
              <CardDescription className="text-gray-400">
                測試API密鑰的基本連接和驗證
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Test */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">連接測試</h4>
                  <p className="text-sm text-gray-400">驗證API服務器連接</p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatus(connectionTest?.success)}
                  <Button
                    onClick={() => testConnection()}
                    disabled={isTestingConnection}
                    size="sm"
                    variant="outline"
                  >
                    {isTestingConnection && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    測試
                  </Button>
                </div>
              </div>

              {connectionTest && renderJsonResponse(connectionTest)}

              <Separator className="bg-gray-700" />

              {/* Token Validation */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">令牌驗證</h4>
                  <p className="text-sm text-gray-400">驗證訪問令牌有效性</p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatus(tokenValidation?.success)}
                  <Button
                    onClick={() => validateToken()}
                    disabled={isValidatingToken}
                    size="sm"
                    variant="outline"
                  >
                    {isValidatingToken && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    驗證
                  </Button>
                </div>
              </div>

              {tokenValidation && renderJsonResponse(tokenValidation)}
            </CardContent>
          </Card>

          {/* API Function Tests */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                API功能測試
              </CardTitle>
              <CardDescription className="text-gray-400">
                測試各種Facebook Graph API功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info Test */}
              <div className="space-y-2">
                <Label className="text-white">用戶信息測試</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="用戶ID (可選，留空測試自己)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => userInfoMutation.mutate(userId || undefined)}
                    disabled={userInfoMutation.isPending}
                    size="sm"
                  >
                    {userInfoMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    測試
                  </Button>
                </div>
                {userInfoMutation.data && renderJsonResponse(userInfoMutation.data)}
              </div>

              <Separator className="bg-gray-700" />

              {/* Page Info Test */}
              <div className="space-y-2">
                <Label className="text-white">頁面信息測試</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Facebook頁面ID"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => pageInfoMutation.mutate(pageId)}
                    disabled={pageInfoMutation.isPending || !pageId}
                    size="sm"
                  >
                    {pageInfoMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    測試
                  </Button>
                </div>
                {pageInfoMutation.data && renderJsonResponse(pageInfoMutation.data)}
              </div>

              <Separator className="bg-gray-700" />

              {/* Page Search Test */}
              <div className="space-y-2">
                <Label className="text-white">頁面搜索測試</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="搜索關鍵詞"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => pageSearchMutation.mutate(searchQuery)}
                    disabled={pageSearchMutation.isPending || !searchQuery}
                    size="sm"
                  >
                    {pageSearchMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    <Search className="w-3 h-3 mr-1" />
                    搜索
                  </Button>
                </div>
                {pageSearchMutation.data && renderJsonResponse(pageSearchMutation.data)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              API信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h4 className="font-medium text-white mb-1">API密鑰</h4>
                <p className="text-sm text-gray-400">693547093284511|kaFJ***</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h4 className="font-medium text-white mb-1">API版本</h4>
                <p className="text-sm text-gray-400">Graph API v18.0</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h4 className="font-medium text-white mb-1">測試狀態</h4>
                <p className="text-sm text-gray-400">準備就緒</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}