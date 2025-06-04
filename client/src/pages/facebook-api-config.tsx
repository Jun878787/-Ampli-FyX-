import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, Plus, Settings, Trash2, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

export default function FacebookApiConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [selectedConfig, setSelectedConfig] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, APIValidationResult>>({});

  // 獲取API配置列表
  const { data: apiConfigs = [], isLoading } = useQuery({
    queryKey: ["/api/facebook/api-configs"],
  });

  // 獲取配置指導信息
  const { data: guidance } = useQuery({
    queryKey: ["/api/facebook/api-guidance"],
  });

  // 驗證配置
  const validateConfigMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/facebook/api-configs/${configId}/validate`, { method: "POST" }),
    onSuccess: (data, configId) => {
      setValidationResults(prev => ({ ...prev, [configId]: data }));
      toast({
        title: data.isValid ? "配置驗證成功" : "配置驗證失敗",
        description: data.isValid ? "API配置有效且可以使用" : data.error,
        variant: data.isValid ? "default" : "destructive"
      });
    }
  });

  // 驗證所有配置
  const validateAllMutation = useMutation({
    mutationFn: () => apiRequest("/api/facebook/api-configs/validate-all", { method: "POST" }),
    onSuccess: (data) => {
      setValidationResults(data);
      toast({
        title: "批量驗證完成",
        description: "所有API配置驗證完成"
      });
    }
  });

  // 添加新配置
  const addConfigMutation = useMutation({
    mutationFn: (config: Omit<FacebookAPIConfig, 'lastUsed'>) => 
      apiRequest("/api/facebook/api-configs", { method: "POST", data: config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      setIsAddDialogOpen(false);
      toast({
        title: "配置添加成功",
        description: "新的Facebook API配置已添加"
      });
    }
  });

  // 更新配置
  const updateConfigMutation = useMutation({
    mutationFn: ({ configId, updates }: { configId: string; updates: Partial<FacebookAPIConfig> }) =>
      apiRequest(`/api/facebook/api-configs/${configId}`, { method: "PUT", data: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      toast({
        title: "配置更新成功",
        description: "API配置已更新"
      });
    }
  });

  // 刪除配置
  const deleteConfigMutation = useMutation({
    mutationFn: (configId: string) => apiRequest(`/api/facebook/api-configs/${configId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      toast({
        title: "配置刪除成功",
        description: "API配置已刪除"
      });
    }
  });

  // 設置活動配置
  const setActiveConfigMutation = useMutation({
    mutationFn: (configId: string) => 
      apiRequest(`/api/facebook/api-configs/${configId}/activate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/api-configs"] });
      toast({
        title: "活動配置已更新",
        description: "新的活動API配置已設置"
      });
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-white">載入中...</div>
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
            <h1 className="text-3xl font-bold text-white">Facebook API 配置</h1>
            <p className="text-gray-400 mt-2">管理多個Facebook API配置和權限</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => validateAllMutation.mutate()}
              disabled={validateAllMutation.isPending}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              {validateAllMutation.isPending ? "驗證中..." : "批量驗證"}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  添加API配置
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>添加新的Facebook API配置</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    配置新的Facebook API密鑰和相關信息
                  </DialogDescription>
                </DialogHeader>
                <AddConfigForm 
                  onSubmit={(config) => addConfigMutation.mutate(config)}
                  isLoading={addConfigMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

              {guidance.requiredPermissions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-blue-400 font-medium">所需權限</h4>
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

        {/* API配置列表 */}
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
                      驗證
                    </Button>
                    {config.id !== 'main' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveConfigMutation.mutate(config.id)}
                          disabled={config.isActive || setActiveConfigMutation.isPending}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          設為活動
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteConfigMutation.mutate(config.id)}
                          disabled={deleteConfigMutation.isPending}
                          className="bg-red-800 border-red-700 text-red-300 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
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

                {config.adAccountId && (
                  <div>
                    <Label className="text-gray-300">廣告帳號ID</Label>
                    <div className="text-white font-mono text-sm bg-gray-900 p-2 rounded">
                      {config.adAccountId}
                    </div>
                  </div>
                )}

                {config.permissions.length > 0 && (
                  <div>
                    <Label className="text-gray-300">權限</Label>
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
              <div className="text-gray-400 mb-4">尚未配置任何Facebook API</div>
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
            placeholder="例: main-ads-api"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">配置名稱 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例: 主要廣告API"
            required
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-300">API密鑰 *</Label>
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
          <Label className="text-gray-300">用途</Label>
          <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value as any })}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="general">通用</SelectItem>
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
          <CheckCircle2 className="h-4 w-4" />
          <span>API配置有效</span>
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
        <span>{result.error || '配置無效'}</span>
      </div>
    );
  }
}