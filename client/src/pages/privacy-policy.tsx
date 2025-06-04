import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">
              北金國際North™Sea 隱私政策
            </CardTitle>
            <p className="text-gray-400 text-center">最後更新：2024年6月</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. 信息收集</h2>
              <p>
                我們收集您在使用北金國際Facebook數據管理平台時提供的信息，包括：
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Facebook帳戶信息和訪問令牌</li>
                <li>廣告活動數據和像素數據</li>
                <li>使用統計和分析數據</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. 信息使用</h2>
              <p>我們使用收集的信息用於：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>提供Facebook數據分析和管理服務</li>
                <li>改善平台功能和用戶體驗</li>
                <li>生成廣告表現報告和洞察</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. 數據安全</h2>
              <p>
                我們採用行業標準的安全措施保護您的數據，包括加密傳輸、安全存儲和訪問控制。
                所有Facebook API調用都通過HTTPS進行，確保數據傳輸安全。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. 數據共享</h2>
              <p>
                我們不會向第三方出售、交易或轉讓您的個人信息。數據僅用於為您提供服務，
                並且嚴格按照Facebook開發者政策處理。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Facebook集成</h2>
              <p>
                本平台使用Facebook Graph API來訪問您的廣告數據。我們僅請求必要的權限，
                並且您可以隨時撤銷應用程式的訪問權限。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. 數據保留</h2>
              <p>
                我們僅在提供服務所需的時間內保留您的數據。您可以隨時要求刪除您的帳戶和相關數據。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. 用戶權利</h2>
              <p>您有權：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>查看我們收集的關於您的信息</li>
                <li>要求更正或刪除您的個人數據</li>
                <li>撤銷對Facebook數據的訪問權限</li>
                <li>導出您的數據</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. 聯繫我們</h2>
              <p>
                如果您對本隱私政策有任何疑問，請通過以下方式聯繫我們：
              </p>
              <div className="mt-2">
                <p>北金國際North™Sea</p>
                <p>電子郵件：privacy@northsea-international.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. 政策更新</h2>
              <p>
                我們可能會不時更新本隱私政策。任何重大變更都會在平台上通知用戶。
                繼續使用我們的服務即表示您接受更新後的政策。
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}