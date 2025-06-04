import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle, Loader2, TestTube, Search, User, FileText, Key, Settings, Plus, Eye, EyeOff, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FacebookAPIConfig {
  id: string;
  name: string;
  apiKey: string;
  appId: string;
  appSecret?: string;
  accessToken?: string;
  adAccountId?: string;
  permissions: string[];
  isActive: boolean;
  description: string;
  lastUsed?: Date;
  rateLimitRemaining?: number;
  purpose: 'ads' | 'pages' | 'analytics' | 'general';
}

interface APIValidationResult {
  isValid: boolean;
  permissions: string[];
  rateLimitInfo: any;
  error?: string;
  adAccounts?: any[];
}

export default function FacebookApiTest() {
  const [pageId, setPageId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, APIValidationResult>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API配置相關查詢
  const { data: apiConfigs = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ["/api/facebook/api-configs"],
  });

  const { data: guidance } = useQuery({
    queryKey: ["/api/facebook/api-guidance"],
  });

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

  // API配置管理mutations
  const addConfigMutation = useMutation({
    mutationFn: (config: Omit<FacebookAPIConfig, 'lastUsed'>) => 
      apiRequest("/api/facebook/api-configs", { method: "POST", data: config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-guidance"] });
      setIsAddDialogOpen(false);
      toast({
        title: "API配置添加成功",
        description: "新的Facebook API配置已添加到測試中心"
      });
    }
  });

  const validateConfigMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/facebook/api-configs/${configId}/validate`, { method: "POST" }),
    onSuccess: (data, configId) => {
      setValidationResults(prev => ({ ...prev, [configId]: data }));
      toast({
        title: data.isValid ? "API配置驗證成功" : "API配置驗證失敗",
        description: data.isValid ? "API配置有效且可以使用" : data.error,
        variant: data.isValid ? "default" : "destructive"
      });
    }
  });

  const setActiveConfigMutation = useMutation({
    mutationFn: (configId: string) => 
      apiRequest(`/api/facebook/api-configs/${configId}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      toast({
        title: "活動API配置已更新",
        description: "測試中心現在使用新的API配置"
      });
    }
  });

  // Graph API測試mutations
  const userInfoMutation = useMutation({
    mutationFn: async (targetUserId?: string) => {
      const endpoint = targetUserId ? `/api/facebook/user/${targetUserId}` : "/api/facebook/user";
      return await apiRequest(endpoint);
    },
    onSuccess: (data) => {
      toast({
        title: "用戶信息獲取成功",
        description: "Facebook Graph API 用戶數據測試完成",
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

  const pageInfoMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return await apiRequest(`/api/facebook/page/${pageId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "頁面信息獲取成功",
        description: "Facebook Graph API 頁面數據測試完成",
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

  const searchPagesMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest(`/api/facebook/search/pages?q=${encodeURIComponent(query)}&limit=10`);
    },
    onSuccess: (data) => {
      toast({
        title: "頁面搜索成功",
        description: "Facebook Graph API 搜索測試完成",
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

  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKey(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  const getStatusBadge = (config: FacebookAPIConfig) => {
    const validation = validationResults[config.id];
    
    if (!validation) {
      return <Badge variant="secondary">未驗證</Badge>;
    }
    
    if (validation.isValid) {
      return <Badge variant="default" className="bg-green-600">有效</Badge>;
    } else {
      return <Badge variant="destructive">無效</Badge>;
    }
  };

  const getPurposeBadge = (purpose: string) => {
    const colors = {
      ads: "bg-blue-600",
      pages: "bg-purple-600", 
      analytics: "bg-orange-600",
      general: "bg-gray-600"
    };
    
    const labels = {
      ads: "廣告管理",
      pages: "頁面管理",
      analytics: "數據分析", 
      general: "通用"
    };
    
    return (
      <Badge className={colors[purpose as keyof typeof colors] || colors.general}>
        {labels[purpose as keyof typeof labels] || purpose}
      </Badge>
    );
  };

  if (isLoadingConfigs) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <div className="text-white">正在載入Facebook Graph API 測試中心...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TestTube className="h-8 w-8 text-blue-500" />
              Facebook Graph API 測試中心
            </h1>
            <p className="text-gray-400 mt-2">配置、測試和管理您的Facebook Graph API連接</p>
          </div>
        </div>

        {/* 主要內容區域 */}
        <Tabs defaultValue="configs" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="configs" className="data-[state=active]:bg-gray-700 text-white">
              <Key className="mr-2 h-4 w-4" />
              API配置管理
            </TabsTrigger>
            <TabsTrigger value="testing" className="data-[state=active]:bg-gray-700 text-white">
              <TestTube className="mr-2 h-4 w-4" />
              Graph API測試
            </TabsTrigger>
          </TabsList>

          {/* API配置管理標籤 */}
          <TabsContent value="configs" className="space-y-6">
            {/* 配置指導信息 */}
            {guidance && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    配置指導
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {guidance.warnings?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-red-400 font-medium">警告</h4>
                      {guidance.warnings.map((warning: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-red-300">
                          <AlertCircle className="h-4 w-4" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {guidance.suggestions?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-yellow-400 font-medium">建議</h4>
                      {guidance.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-yellow-300">
                          <CheckCircle className="h-4 w-4" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {guidance.requiredPermissions?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-blue-400 font-medium">Graph API 所需權限</h4>
                      <div className="flex flex-wrap gap-2">
                        {guidance.requiredPermissions.map((permission: string) => (
                          <Badge key={permission} variant="outline" className="border-blue-600 text-blue-400">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* API配置列表標題和添加按鈕 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">API配置列表</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    添加API配置
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>添加Facebook Graph API配置</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      配置新的Facebook Graph API密鑰和相關信息
                    </DialogDescription>
                  </DialogHeader>
                  <AddConfigForm 
                    onSubmit={(config) => addConfigMutation.mutate(config)}
                    isLoading={addConfigMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* API配置卡片列表 */}
            <div className="grid gap-6">
              {apiConfigs.map((config: FacebookAPIConfig) => (
                <Card key={config.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-white">{config.name}</CardTitle>
                        {getStatusBadge(config)}
                        {getPurposeBadge(config.purpose)}
                        {config.isActive && (
                          <Badge className="bg-green-600">活動中</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateConfigMutation.mutate(config.id)}
                          disabled={validateConfigMutation.isPending}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          {validateConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "驗證"}
                        </Button>
                        {!config.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveConfigMutation.mutate(config.id)}
                            disabled={setActiveConfigMutation.isPending}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            設為活動
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-gray-400">
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">應用ID</Label>
                        <div className="text-white font-mono text-sm bg-gray-900 p-2 rounded">
                          {config.appId || '未設置'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">API密鑰</Label>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-mono text-sm bg-gray-900 p-2 rounded flex-1">
                            {showApiKey[config.id] 
                              ? config.apiKey 
                              : config.apiKey.replace(/./g, '*')
                            }
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleApiKeyVisibility(config.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showApiKey[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {config.permissions.length > 0 && (
                      <div>
                        <Label className="text-gray-300">Graph API 權限</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {config.permissions.map(permission => (
                            <Badge key={permission} variant="outline" className="border-gray-600 text-gray-300">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {validationResults[config.id] && (
                      <div className="border-t border-gray-700 pt-4">
                        <Label className="text-gray-300">驗證結果</Label>
                        <ValidationResultDisplay result={validationResults[config.id]} />
                      </div>
                    )}

                    {config.lastUsed && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="h-4 w-4" />
                        最後使用: {new Date(config.lastUsed).toLocaleString('zh-TW')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {apiConfigs.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">尚未配置任何Facebook Graph API</div>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    添加第一個API配置
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Graph API測試標籤 */}
          <TabsContent value="testing" className="space-y-6">
            {/* 連接狀態測試 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    連接測試
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    測試Facebook Graph API基本連接
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => testConnection()} 
                    disabled={isTestingConnection}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="mr-2 h-4 w-4" />
                    )}
                    測試連接
                  </Button>
                  
                  {connectionTest && (
                    <div className="mt-4">
                      <Label className="text-gray-300">測試結果:</Label>
                      <pre className="bg-gray-900 p-3 rounded text-sm text-white overflow-auto max-h-32">
                        {typeof connectionTest === 'object' ? JSON.stringify(connectionTest, null, 2) : String(connectionTest)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-500" />
                    令牌驗證
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    驗證當前API令牌有效性
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => validateToken()} 
                    disabled={isValidatingToken}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isValidatingToken ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    驗證令牌
                  </Button>
                  
                  {tokenValidation && (
                    <div className="mt-4">
                      <Label className="text-gray-300">驗證結果:</Label>
                      <pre className="bg-gray-900 p-3 rounded text-sm text-white overflow-auto max-h-32">
                        {typeof tokenValidation === 'object' ? JSON.stringify(tokenValidation, null, 2) : String(tokenValidation)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Graph API數據測試 */}
            <div className="grid gap-6">
              {/* 用戶信息測試 */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    用戶信息測試
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    測試Facebook Graph API用戶數據獲取
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="userId" className="text-gray-300">用戶ID (可選)</Label>
                      <Input
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="留空獲取當前用戶信息"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => userInfoMutation.mutate(userId || undefined)}
                        disabled={userInfoMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {userInfoMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <User className="mr-2 h-4 w-4" />
                        )}
                        測試
                      </Button>
                    </div>
                  </div>
                  
                  {userInfoMutation.data && (
                    <div>
                      <Label className="text-gray-300">API響應:</Label>
                      <pre className="bg-gray-900 p-3 rounded text-sm text-white overflow-auto max-h-40 mt-2">
                        {JSON.stringify(userInfoMutation.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 頁面信息測試 */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    頁面信息測試
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    測試Facebook Graph API頁面數據獲取
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="pageId" className="text-gray-300">頁面ID</Label>
                      <Input
                        id="pageId"
                        value={pageId}
                        onChange={(e) => setPageId(e.target.value)}
                        placeholder="輸入Facebook頁面ID"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => pageInfoMutation.mutate(pageId)}
                        disabled={!pageId || pageInfoMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {pageInfoMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        測試
                      </Button>
                    </div>
                  </div>
                  
                  {pageInfoMutation.data && (
                    <div>
                      <Label className="text-gray-300">API響應:</Label>
                      <pre className="bg-gray-900 p-3 rounded text-sm text-white overflow-auto max-h-40 mt-2">
                        {JSON.stringify(pageInfoMutation.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 頁面搜索測試 */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="h-5 w-5 text-purple-500" />
                    頁面搜索測試
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    測試Facebook Graph API頁面搜索功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="searchQuery" className="text-gray-300">搜索關鍵字</Label>
                      <Input
                        id="searchQuery"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="輸入搜索關鍵字"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => searchPagesMutation.mutate(searchQuery)}
                        disabled={!searchQuery || searchPagesMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {searchPagesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="mr-2 h-4 w-4" />
                        )}
                        搜索
                      </Button>
                    </div>
                  </div>
                  
                  {searchPagesMutation.data && (
                    <div>
                      <Label className="text-gray-300">API響應:</Label>
                      <pre className="bg-gray-900 p-3 rounded text-sm text-white overflow-auto max-h-40 mt-2">
                        {JSON.stringify(searchPagesMutation.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 添加配置表單組件
function AddConfigForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (config: Omit<FacebookAPIConfig, 'lastUsed'>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    apiKey: '',
    appId: '',
    appSecret: '',
    accessToken: '',
    adAccountId: '',
    purpose: 'general' as const,
    description: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config: Omit<FacebookAPIConfig, 'lastUsed'> = {
      ...formData,
      permissions: getPurposePermissions(formData.purpose)
    };
    
    onSubmit(config);
  };

  const getPurposePermissions = (purpose: string): string[] => {
    switch (purpose) {
      case 'ads':
        return ['ads_read', 'ads_management', 'business_management'];
      case 'pages':
        return ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'];
      case 'analytics':
        return ['read_insights', 'ads_read', 'pages_read_engagement'];
      default:
        return ['ads_read', 'pages_read_engagement'];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">配置ID *</Label>
          <Input
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="例: test-api-1"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">配置名稱 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例: 測試API配置"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-300">Graph API 密鑰 *</Label>
        <Input
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder="Facebook App ID|App Secret"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">應用ID</Label>
          <Input
            value={formData.appId}
            onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
            placeholder="Facebook App ID"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">API用途</Label>
          <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value as any })}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="general">通用測試</SelectItem>
              <SelectItem value="ads">廣告管理</SelectItem>
              <SelectItem value="pages">頁面管理</SelectItem>
              <SelectItem value="analytics">數據分析</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-gray-300">描述</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="描述此API配置的用途..."
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="text-gray-300">啟用此配置</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? "添加中..." : "添加配置"}
        </Button>
      </div>
    </form>
  );
}

// 驗證結果顯示組件
function ValidationResultDisplay({ result }: { result: APIValidationResult }) {
  if (result.isValid) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>Graph API配置有效</span>
        </div>
        
        {result.permissions.length > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-2">可用權限:</div>
            <div className="flex flex-wrap gap-1">
              {result.permissions.map(permission => (
                <Badge key={permission} variant="outline" className="border-green-600 text-green-400 text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {result.adAccounts && result.adAccounts.length > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-2">可訪問的廣告帳號:</div>
            <div className="space-y-1">
              {result.adAccounts.slice(0, 3).map((account: any) => (
                <div key={account.id} className="text-sm text-white bg-gray-900 p-2 rounded">
                  {account.name} ({account.id})
                </div>
              ))}
              {result.adAccounts.length > 3 && (
                <div className="text-sm text-gray-400">
                  +{result.adAccounts.length - 3} 個其他帳號
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircle className="h-4 w-4" />
        <span>{result.error || 'Graph API配置無效'}</span>
      </div>
    );
  }
}