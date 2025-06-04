import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, XCircle, ExternalLink, Key, Globe, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FacebookGraphAPITest() {
  const [accessToken, setAccessToken] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已複製",
      description: "內容已複製到剪貼板",
    });
  };

  const testConnection = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "錯誤",
        description: "請先輸入訪問權杖",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/facebook/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({ success: false, error: '連接失敗' });
    } finally {
      setLoading(false);
    }
  };

  const requiredPermissions = [
    "ads_read",
    "ads_management", 
    "business_management",
    "read_insights",
    "pages_read_engagement"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Facebook Graph API 測試中心
          </h1>
          <p className="text-gray-300 text-lg">
            測試和驗證您的Facebook API訪問權杖
          </p>
        </div>

        {/* Token Generator Guide */}
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
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="text-white font-medium">前往Facebook Graph API Explorer</p>
                  <p className="text-gray-400 text-sm">訪問 developers.facebook.com/tools/explorer</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 bg-transparent border-gray-600 text-blue-400 hover:bg-blue-600/20"
                    onClick={() => window.open('https://developers.facebook.com/tools/explorer', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    打開Graph API Explorer
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="text-white font-medium">選擇您的應用程式</p>
                  <p className="text-gray-400 text-sm">在右上角選擇您的Facebook應用程式</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="text-white font-medium">獲取訪問權杖</p>
                  <p className="text-gray-400 text-sm">點擊"獲取權杖" &gt; "獲取用戶訪問權杖"</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="text-white font-medium">選擇所需權限</p>
                  <p className="text-gray-400 text-sm mb-2">請勾選以下權限：</p>
                  <div className="flex flex-wrap gap-2">
                    {requiredPermissions.map(permission => (
                      <Badge key={permission} variant="outline" className="border-blue-400 text-blue-400">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <p className="text-white font-medium">生成權杖</p>
                  <p className="text-gray-400 text-sm">點擊"生成訪問權杖"並複製生成的權杖</p>
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

            <Button 
              onClick={testConnection} 
              disabled={loading || !accessToken.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "測試中..." : "測試連接"}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <Separator className="bg-gray-600" />
                
                {testResults.success ? (
                  <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      <strong>連接成功！</strong>
                      <br />
                      用戶: {testResults.user?.name}
                      <br />
                      ID: {testResults.user?.id}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-500 bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      <strong>連接失敗:</strong> {testResults.error}
                    </AlertDescription>
                  </Alert>
                )}

                {testResults.permissions && (
                  <div>
                    <h3 className="text-white font-medium mb-2">當前權限:</h3>
                    <div className="flex flex-wrap gap-2">
                      {testResults.permissions.map((permission: string) => (
                        <Badge 
                          key={permission} 
                          variant={requiredPermissions.includes(permission) ? "default" : "secondary"}
                          className={requiredPermissions.includes(permission) 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-600 text-gray-300"
                          }
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.missingPermissions && testResults.missingPermissions.length > 0 && (
                  <div>
                    <h3 className="text-red-400 font-medium mb-2">缺少權限:</h3>
                    <div className="flex flex-wrap gap-2">
                      {testResults.missingPermissions.map((permission: string) => (
                        <Badge key={permission} variant="destructive">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.adAccounts && (
                  <div>
                    <h3 className="text-white font-medium mb-2">廣告帳戶:</h3>
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <pre className="text-gray-300 text-sm overflow-auto">
                        {JSON.stringify(testResults.adAccounts, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Token for Testing */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5" />
              測試用權杖範例
            </CardTitle>
            <CardDescription className="text-gray-300">
              如果您需要快速測試，可以使用應用程式權杖（僅限公開數據）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">應用程式權杖（僅限公開數據）</Label>
              <div className="flex gap-2">
                <Input
                  value="1030636252513639|rrA9s8oe5V9Ttl0LAl3m6aOlyHk"
                  readOnly
                  className="bg-gray-700/50 border-gray-600 text-gray-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard("1030636252513639|rrA9s8oe5V9Ttl0LAl3m6aOlyHk")}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-600/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm">
                注意：應用程式權杖只能訪問公開數據，無法獲取私人廣告數據
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}