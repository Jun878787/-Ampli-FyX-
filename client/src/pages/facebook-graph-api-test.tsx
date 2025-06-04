import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Key, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  BookOpen,
  Building,
  User
} from "lucide-react";

export default function FacebookGraphAPITest() {
  const [accessToken, setAccessToken] = useState("");
  
  const requiredPermissions = [
    "ads_read",
    "ads_management", 
    "business_management",
    "pages_read_engagement",
    "pages_show_list"
  ];

  const tokenTestResult = useQuery({
    queryKey: ["/api/facebook/test-token", accessToken],
    enabled: false
  });

  const handleTestToken = () => {
    if (accessToken) {
      tokenTestResult.refetch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Facebook Graph API 測試中心</h1>
            <p className="text-gray-300">生成並測試具有廣告權限的Facebook訪問權杖</p>
          </div>
          
          <div className="space-y-6">
            {/* Step-by-step Guide */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Key className="h-5 w-5" />
                  如何獲取具有廣告權限的訪問權杖
                </CardTitle>
                <CardDescription className="text-gray-300">
                  按照以下步驟生成具有廣告管理權限的訪問權杖
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="mb-4 bg-red-900/20 border-red-600">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertTitle className="text-red-400">廣告權限需要商家驗證</AlertTitle>
                  <AlertDescription className="text-red-300">
                    Facebook廣告API需要商家驗證才能獲取ads_read、ads_management等權限。個人開發者帳戶無法直接使用廣告功能。
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
                    <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      商家驗證流程（獲取廣告權限）
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-orange-300">要獲取廣告API權限，您需要完成Facebook商家驗證：</p>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <p className="text-orange-300 font-medium">建立商家帳戶</p>
                          <p className="text-orange-400/80">在Meta Business Manager創建商家帳戶</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <p className="text-orange-300 font-medium">提交商家驗證</p>
                          <p className="text-orange-400/80">提供公司資料、營業執照等文件</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <p className="text-orange-300 font-medium">等待審核</p>
                          <p className="text-orange-400/80">審核通常需要3-5個工作天</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                        <div>
                          <p className="text-orange-300 font-medium">創建廣告應用程式</p>
                          <p className="text-orange-400/80">驗證通過後即可創建具有廣告權限的應用程式</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-transparent border-orange-600 text-orange-400 hover:bg-orange-600/20"
                          onClick={() => window.open('https://business.facebook.com', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Meta Business Manager
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-transparent border-orange-600 text-orange-400 hover:bg-orange-600/20"
                          onClick={() => window.open('https://developers.facebook.com/docs/development/business-verification', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          驗證指南
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      現有功能（無需廣告權限）
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-blue-400/80">在等待商家驗證期間，您可以使用這些功能：</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-blue-300 text-sm">用戶基本資料</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-blue-300 text-sm">頁面信息獲取</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-blue-300 text-sm">公開貼文數據</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-blue-300 text-sm">朋友列表管理</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-gray-400 text-sm">廣告數據 (需驗證)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-gray-400 text-sm">廣告管理 (需驗證)</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 bg-transparent border-blue-600 text-blue-400 hover:bg-blue-600/20"
                        onClick={() => window.open('https://developers.facebook.com/tools/explorer', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        測試可用功能
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                    <h3 className="text-green-400 font-semibold mb-3">立即可用的替代方案</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-300">我們的系統已經整合了這些功能，您現在就可以使用：</p>
                      <ul className="space-y-1 text-green-400/80">
                        <li>• Facebook帳號管理和批量操作</li>
                        <li>• 公開頁面內容採集和分析</li>
                        <li>• 朋友列表管理和互動追蹤</li>
                        <li>• 用戶資料收集和整理</li>
                      </ul>
                      <p className="text-green-300 mt-2">這些功能不需要廣告權限，可以滿足大部分數據收集需求。</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Testing */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5" />
                  測試訪問權杖
                </CardTitle>
                <CardDescription className="text-gray-300">
                  輸入您的訪問權杖以測試權限和連接
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken" className="text-white">Facebook訪問權杖</Label>
                  <Textarea
                    id="accessToken"
                    placeholder="請貼上您的Facebook訪問權杖..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestToken}
                    disabled={!accessToken || tokenTestResult?.isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {tokenTestResult?.isLoading ? "測試中..." : "測試權杖"}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setAccessToken("")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    清除
                  </Button>
                </div>

                {/* Test Results */}
                {tokenTestResult && !tokenTestResult.isLoading && (
                  <div className="space-y-4">
                    <Separator className="bg-gray-600" />
                    
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">測試結果</h3>
                      
                      {/* Connection Status */}
                      <div className="flex items-center gap-2">
                        {tokenTestResult.data?.success ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className={`font-medium ${tokenTestResult.data?.success ? 'text-green-400' : 'text-red-400'}`}>
                          {tokenTestResult.data?.success ? '連接成功' : '連接失敗'}
                        </span>
                      </div>

                      {/* Error Message */}
                      {tokenTestResult.data?.error && (
                        <Alert className="bg-red-900/20 border-red-600">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <AlertTitle className="text-red-400">錯誤</AlertTitle>
                          <AlertDescription className="text-red-300">
                            {tokenTestResult.data.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* User Information */}
                      {tokenTestResult.data?.data && (
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">用戶信息</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-300">
                              <span className="text-gray-400">用戶ID:</span> {tokenTestResult.data.data.id}
                            </p>
                            <p className="text-gray-300">
                              <span className="text-gray-400">姓名:</span> {tokenTestResult.data.data.name}
                            </p>
                            {tokenTestResult.data.data.email && (
                              <p className="text-gray-300">
                                <span className="text-gray-400">郵箱:</span> {tokenTestResult.data.data.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Available Permissions */}
                      {tokenTestResult.data?.success && (
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">權限狀態</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {requiredPermissions.map((permission) => (
                              <div key={permission} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="text-gray-300 text-sm">{permission}</span>
                                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                                  需要驗證
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <p className="text-gray-400 text-sm mt-2">
                            注意：如果您只有基本權限，某些廣告功能可能無法使用。
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}