import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
              <FileText className="h-6 w-6 text-blue-400" />
              北金國際North™Sea 服務條款
            </CardTitle>
            <p className="text-gray-400 text-center">最後更新：2024年6月</p>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-6">
            
            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                1. 服務概述
              </h2>
              <p>
                北金國際North™Sea Facebook數據管理平台（以下簡稱"本平台"）為用戶提供Facebook數據分析、
                廣告管理和社交媒體洞察服務。使用本平台即表示您同意遵守這些服務條款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. 用戶資格</h2>
              <p>使用本服務，您必須：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>年滿18歲或在您所在司法管轄區的法定年齡</li>
                <li>擁有有效的Facebook Business Manager帳戶</li>
                <li>具備合法使用Facebook廣告API的權限</li>
                <li>同意遵守Facebook的開發者政策和條款</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. 服務功能</h2>
              <p>本平台提供以下服務：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Facebook廣告數據提取和分析</li>
                <li>像素追蹤和轉換分析</li>
                <li>多帳戶管理和批量操作</li>
                <li>自動化訊息和回覆系統</li>
                <li>數據導出和報告生成</li>
                <li>受眾分析和洞察</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. 用戶責任</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">4.1 API使用合規</h3>
                <p>您承諾：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>僅使用合法獲得的Facebook訪問令牌</li>
                  <li>遵守Facebook API的使用限制和政策</li>
                  <li>不進行任何可能違反Facebook服務條款的行為</li>
                  <li>保護您的API憑證和訪問令牌的安全</li>
                </ul>

                <h3 className="text-lg font-semibold text-white">4.2 數據使用</h3>
                <p>您同意：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>僅將提取的數據用於合法的商業目的</li>
                  <li>不與未經授權的第三方分享Facebook數據</li>
                  <li>遵守適用的數據保護法規（如GDPR、CCPA）</li>
                  <li>對您處理的個人數據負責</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. 服務限制</h2>
              <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-400">重要限制</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-300">
                  <li>服務可用性取決於Facebook API的狀態</li>
                  <li>數據提取速度受Facebook API限制約束</li>
                  <li>某些功能需要特定的Facebook權限</li>
                  <li>我們不保證100%的服務正常運行時間</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. 知識產權</h2>
              <p>
                本平台的所有內容、功能和技術均為北金國際North™Sea的財產。
                您獲得使用本服務的有限、非排他性、不可轉讓的許可。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. 隱私和數據保護</h2>
              <p>
                我們致力於保護您的隱私。有關我們如何收集、使用和保護您的數據的詳細信息，
                請參閱我們的隱私政策。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. 服務終止</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">8.1 用戶終止</h3>
                <p>您可以隨時停止使用本服務並要求刪除您的帳戶。</p>

                <h3 className="text-lg font-semibold text-white">8.2 我們的終止權利</h3>
                <p>我們保留在以下情況下終止您訪問的權利：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>違反這些服務條款</li>
                  <li>濫用我們的服務或API</li>
                  <li>進行非法或有害活動</li>
                  <li>長期不活躍</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. 免責聲明</h2>
              <p>
                本服務按"現狀"提供，不提供任何明示或暗示的保證。我們不保證服務的準確性、
                完整性或可靠性。使用本服務的風險由您自行承擔。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. 責任限制</h2>
              <p>
                在任何情況下，北金國際North™Sea均不對任何直接、間接、偶然、特殊或後果性損害負責，
                包括但不限於利潤損失、數據丟失或業務中斷。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. 爭議解決</h2>
              <p>
                因本服務條款產生的任何爭議應首先通過友好協商解決。如無法達成一致，
                爭議將提交至有管轄權的法院解決。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. 條款修改</h2>
              <p>
                我們保留隨時修改這些服務條款的權利。重大變更將通過平台通知用戶。
                繼續使用服務即表示接受修改後的條款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. 聯繫信息</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">北金國際North™Sea</p>
                <p>電子郵件：legal@northsea-international.com</p>
                <p>主題：服務條款查詢</p>
                <p className="mt-2 text-sm text-gray-400">
                  如對這些條款有任何疑問，請隨時與我們聯繫。
                </p>
              </div>
            </section>

            <section className="border-t border-gray-600 pt-4">
              <p className="text-sm text-gray-400 text-center">
                © 2024 北金國際North™Sea. 版權所有。
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}