import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileText, Database, Calendar, Filter, Settings, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const exportSchema = z.object({
  format: z.enum(["csv", "json", "xlsx", "xml"]),
  dataTypes: z.array(z.string()).min(1, "請至少選擇一種數據類型"),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  filters: z.object({
    includeMetadata: z.boolean().default(true),
    compression: z.boolean().default(false),
    encoding: z.enum(["utf-8", "gb2312", "big5"]).default("utf-8"),
  }),
});

type ExportForm = z.infer<typeof exportSchema>;

export default function ExportData() {
  const [selectedTab, setSelectedTab] = useState("quick-export");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { data: exportHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/export/history"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const exportForm = useForm<ExportForm>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "csv",
      dataTypes: [],
      filters: {
        includeMetadata: true,
        compression: false,
        encoding: "utf-8",
      },
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (data: ExportForm) => {
      return await apiRequest("/api/export", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      setIsExportDialogOpen(false);
      exportForm.reset();
    },
  });

  const quickExportMutation = useMutation({
    mutationFn: async ({ format, type }: { format: string; type: string }) => {
      return await apiRequest("/api/export/quick", {
        method: "POST",
        data: { format, type },
      });
    },
  });

  const onExport = (data: ExportForm) => {
    exportMutation.mutate(data);
  };

  const handleQuickExport = (format: string, type: string) => {
    quickExportMutation.mutate({ format, type });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">導出數據</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook數據導出和下載管理</p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">可導出數據</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.totalCollected || 0}</p>
                </div>
                <Database className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">今日導出</p>
                  <p className="text-2xl font-bold text-slate-100">{exportHistory.filter((h: any) => {
                    const today = new Date().toDateString();
                    return new Date(h.createdAt).toDateString() === today;
                  }).length}</p>
                </div>
                <Download className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">導出任務</p>
                  <p className="text-2xl font-bold text-slate-100">{exportHistory.filter((h: any) => h.status === "processing").length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總檔案大小</p>
                  <p className="text-2xl font-bold text-slate-100">2.3GB</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="quick-export" className="rounded-lg">快速導出</TabsTrigger>
            <TabsTrigger value="custom-export" className="rounded-lg">自定義導出</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">導出記錄</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg">導出設置</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-export">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    所有數據 (CSV)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    導出所有收集的數據為CSV格式
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>數據量：</span>
                    <span>{stats?.totalCollected || 0} 筆</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>預估大小：</span>
                    <span>~15MB</span>
                  </div>
                  <Button 
                    onClick={() => handleQuickExport("csv", "all")}
                    disabled={quickExportMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {quickExportMutation.isPending ? "導出中..." : "立即導出"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-400" />
                    貼文數據 (JSON)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    僅導出貼文相關數據為JSON格式
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>數據量：</span>
                    <span>{stats?.postData || 0} 筆</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>預估大小：</span>
                    <span>~8MB</span>
                  </div>
                  <Button 
                    onClick={() => handleQuickExport("json", "posts")}
                    disabled={quickExportMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {quickExportMutation.isPending ? "導出中..." : "立即導出"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-400" />
                    本週數據 (Excel)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    導出本週收集的數據為Excel格式
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>數據量：</span>
                    <span>{stats?.weeklyData || 0} 筆</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>預估大小：</span>
                    <span>~3MB</span>
                  </div>
                  <Button 
                    onClick={() => handleQuickExport("xlsx", "weekly")}
                    disabled={quickExportMutation.isPending}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {quickExportMutation.isPending ? "導出中..." : "立即導出"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom-export">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">自定義數據導出</CardTitle>
                  <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Settings className="h-4 w-4 mr-2" />
                        配置導出
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl rounded-xl">
                      <DialogHeader>
                        <DialogTitle>配置自定義導出</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          設置詳細的導出參數和篩選條件
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...exportForm}>
                        <form onSubmit={exportForm.handleSubmit(onExport)} className="space-y-4">
                          <FormField
                            control={exportForm.control}
                            name="format"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">導出格式</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-wrap gap-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="csv" id="csv" />
                                      <label htmlFor="csv" className="text-slate-300">CSV</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="json" id="json" />
                                      <label htmlFor="json" className="text-slate-300">JSON</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="xlsx" id="xlsx" />
                                      <label htmlFor="xlsx" className="text-slate-300">Excel</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="xml" id="xml" />
                                      <label htmlFor="xml" className="text-slate-300">XML</label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={exportForm.control}
                            name="dataTypes"
                            render={() => (
                              <FormItem>
                                <FormLabel className="text-slate-200">數據類型</FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  {["posts", "comments", "profiles", "pages", "groups"].map((type) => (
                                    <FormField
                                      key={type}
                                      control={exportForm.control}
                                      name="dataTypes"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(type)}
                                              onCheckedChange={(checked) => {
                                                const updatedValue = checked
                                                  ? [...(field.value || []), type]
                                                  : field.value?.filter((value) => value !== type) || [];
                                                field.onChange(updatedValue);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-slate-300 text-sm font-normal">
                                            {type === "posts" ? "貼文" : 
                                             type === "comments" ? "評論" : 
                                             type === "profiles" ? "用戶資料" : 
                                             type === "pages" ? "粉絲專頁" : "群組"}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={exportForm.control}
                              name="dateRange.start"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">開始日期</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={exportForm.control}
                              name="dateRange.end"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">結束日期</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-3">
                            <FormField
                              control={exportForm.control}
                              name="filters.includeMetadata"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-3 shadow-sm bg-slate-700">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-slate-200">包含元數據</FormLabel>
                                    <FormDescription className="text-slate-400 text-sm">
                                      包含數據收集時間、來源等額外信息
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={exportForm.control}
                              name="filters.compression"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-3 shadow-sm bg-slate-700">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-slate-200">壓縮文件</FormLabel>
                                    <FormDescription className="text-slate-400 text-sm">
                                      將導出文件打包為ZIP格式
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsExportDialogOpen(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                              取消
                            </Button>
                            <Button
                              type="submit"
                              disabled={exportMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              {exportMutation.isPending ? "導出中..." : "開始導出"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  點擊"配置導出"按鈕開始自定義導出設置
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">導出記錄</CardTitle>
                <CardDescription className="text-slate-400">
                  查看和管理歷史導出任務
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportHistory.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">尚無導出記錄</div>
                  ) : (
                    exportHistory.map((item: any) => (
                      <Card key={item.id} className="bg-slate-700/50 border-slate-600 rounded-lg">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-blue-400" />
                              <div>
                                <h3 className="font-semibold text-slate-100">{item.filename}</h3>
                                <p className="text-slate-400 text-sm">
                                  {item.format.toUpperCase()} • {item.size} • {new Date(item.createdAt).toLocaleString("zh-TW")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={item.status === "completed" ? "default" : item.status === "processing" ? "secondary" : "destructive"}
                                className={`rounded-md ${
                                  item.status === "completed" 
                                    ? "bg-green-600 text-white" 
                                    : item.status === "processing"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {item.status === "completed" ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />完成</>
                                ) : item.status === "processing" ? (
                                  <><Clock className="h-3 w-3 mr-1" />處理中</>
                                ) : (
                                  <><AlertCircle className="h-3 w-3 mr-1" />失敗</>
                                )}
                              </Badge>
                              {item.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  下載
                                </Button>
                              )}
                            </div>
                          </div>
                          {item.status === "processing" && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm text-slate-400 mb-1">
                                <span>導出進度</span>
                                <span>{item.progress}%</span>
                              </div>
                              <Progress value={item.progress} className="h-2" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">導出設置</CardTitle>
                <CardDescription className="text-slate-400">
                  配置默認導出參數和偏好設置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  導出設置功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
