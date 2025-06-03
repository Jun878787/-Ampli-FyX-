import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExportData() {
  return (
    <>
      <Header
        title="導出數據"
        description="導出和下載收集的數據"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>數據導出頁面</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">此頁面功能正在開發中...</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
