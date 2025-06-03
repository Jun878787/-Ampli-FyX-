import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataCollection() {
  return (
    <>
      <Header
        title="數據採集"
        description="配置和管理 Facebook 數據採集任務"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>數據採集頁面</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">此頁面功能正在開發中...</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
