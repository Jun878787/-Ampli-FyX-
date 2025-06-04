import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataDeletion() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "錯誤",
        description: "請提供您的電子郵件地址",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitted(true);
    toast({
      title: "刪除請求已提交",
      description: "我們將在48小時內處理您的資料刪除請求",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
              <Trash2 className="h-6 w-6 text-red-400" />
              用戶資料刪除請求
            </CardTitle>
            <p className="text-gray-400 text-center">北金國際North™Sea Facebook數據管理平台</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            
            {!isSubmitted ? (
              <>
                <section className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-400">重要提醒</h3>
                  </div>
                  <p className="text-red-300">
                    提交此請求將永久刪除您在我們平台上的所有資料，包括：
                  </p>
                  <ul className="list-disc list-inside mt-2 text-red-300 space-y-1">
                    <li>帳戶資訊和設定</li>
                    <li>Facebook API訪問記錄</li>
                    <li>廣告數據分析歷史</li>
                    <li>所有導出的報告和數據</li>
                  </ul>
                  <p className="text-red-300 mt-2 font-semibold">此操作無法撤銷！</p>
                </section>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white">電子郵件地址 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="請輸入與您帳戶關聯的電子郵件地址"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason" className="text-white">刪除原因 (可選)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="請說明您要求刪除資料的原因"
                      rows={4}
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    提交刪除請求
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <h3 className="text-xl font-semibold text-green-400">刪除請求已提交</h3>
                <p className="text-gray-300">
                  我們已收到您的資料刪除請求。我們將在48小時內開始處理，並在完成後向您的電子郵件地址發送確認。
                </p>
                <div className="bg-gray-700 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-white mb-2">處理時間表：</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• 立即停用帳戶訪問</li>
                    <li>• 24小時內刪除個人資料</li>
                    <li>• 48小時內完全清除所有數據</li>
                    <li>• 發送刪除確認電子郵件</li>
                  </ul>
                </div>
              </div>
            )}

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">關於資料刪除</h2>
              <div className="space-y-3">
                <p>
                  根據GDPR和相關數據保護法規，您有權要求刪除我們處理的關於您的個人資料。
                </p>
                
                <h3 className="text-lg font-semibold text-white">將被刪除的資料包括：</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>個人識別資訊（姓名、電子郵件、電話號碼）</li>
                  <li>Facebook API訪問權杖和相關憑證</li>
                  <li>廣告活動數據和分析結果</li>
                  <li>使用日誌和活動記錄</li>
                  <li>所有導出的報告和數據檔案</li>
                </ul>

                <h3 className="text-lg font-semibold text-white">保留的資料：</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>匿名化的使用統計（無法識別個人身份）</li>
                  <li>法律要求保留的記錄（如適用）</li>
                </ul>

                <h3 className="text-lg font-semibold text-white">聯繫我們：</h3>
                <p>
                  如果您對資料刪除過程有任何疑問，請聯繫我們：
                </p>
                <div className="bg-gray-700 rounded-lg p-3 mt-2">
                  <p>電子郵件：privacy@northsea-international.com</p>
                  <p>主題：資料刪除查詢</p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}