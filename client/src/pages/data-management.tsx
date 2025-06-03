import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataManagement() {
  return (
    <>
      <Header
        title="數據管理"
        description="管理和組織收集的 Facebook 數據"
      />
      
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>數據管理頁面</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">此頁面功能正在開發中...</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
