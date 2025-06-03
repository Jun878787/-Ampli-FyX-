import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Trash2, Edit, Eye, Download, FileText, Users, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

export default function DataManagement() {
  const [selectedTab, setSelectedTab] = useState("all-data");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: collectedData, isLoading } = useQuery({
    queryKey: ["/api/data", currentPage, searchQuery, selectedType],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const deleteDataMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("/api/data/batch-delete", {
        method: "POST",
        data: { ids },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedItems([]);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async ({ ids, format }: { ids: number[]; format: string }) => {
      return await apiRequest("/api/export", {
        method: "POST",
        data: { ids, format },
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && collectedData?.data) {
      setSelectedItems(collectedData.data.map((item: any) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.length > 0) {
      deleteDataMutation.mutate(selectedItems);
    }
  };

  const handleExport = (format: string) => {
    exportDataMutation.mutate({ ids: selectedItems, format });
  };

  const viewItemDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">數據管理</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - Facebook收集數據管理和組織</p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">總數據量</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.totalCollected || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">用戶資料</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.userProfiles || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">今日收集</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.todayCollected || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">數據類型</p>
                  <p className="text-2xl font-bold text-slate-100">{stats?.dataTypes || 0}</p>
                </div>
                <Tag className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="all-data" className="rounded-lg">所有數據</TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg">貼文內容</TabsTrigger>
            <TabsTrigger value="comments" className="rounded-lg">評論互動</TabsTrigger>
            <TabsTrigger value="profiles" className="rounded-lg">用戶資料</TabsTrigger>
          </TabsList>

          <TabsContent value="all-data">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">收集數據管理</CardTitle>
                  <div className="flex items-center gap-4">
                    {selectedItems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport("csv")}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          導出CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport("json")}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          導出JSON
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleBatchDelete}
                          className="bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          批量刪除 ({selectedItems.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="搜索數據內容..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                      <SelectItem value="all">所有類型</SelectItem>
                      <SelectItem value="post">貼文</SelectItem>
                      <SelectItem value="comment">評論</SelectItem>
                      <SelectItem value="profile">用戶資料</SelectItem>
                      <SelectItem value="page">粉絲專頁</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-lg"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    篩選
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-slate-400 py-8">載入中...</div>
                ) : !collectedData?.data || collectedData.data.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">尚無收集數據</div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-800/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={collectedData.data.length > 0 && selectedItems.length === collectedData.data.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="text-slate-300">類型</TableHead>
                          <TableHead className="text-slate-300">內容</TableHead>
                          <TableHead className="text-slate-300">來源</TableHead>
                          <TableHead className="text-slate-300">收集時間</TableHead>
                          <TableHead className="text-slate-300">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectedData.data.map((item: any) => (
                          <TableRow key={item.id} className="border-slate-700 hover:bg-slate-800/50">
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`rounded-md ${
                                  item.type === "post"
                                    ? "border-blue-600 text-blue-300"
                                    : item.type === "comment"
                                    ? "border-green-600 text-green-300"
                                    : item.type === "profile"
                                    ? "border-purple-600 text-purple-300"
                                    : "border-slate-600 text-slate-300"
                                }`}
                              >
                                {item.type === "post" ? "貼文" : 
                                 item.type === "comment" ? "評論" : 
                                 item.type === "profile" ? "用戶" : item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300 max-w-md truncate">
                              {item.content}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {item.source || "Facebook"}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewItemDetail(item)}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteDataMutation.mutate([item.id])}
                                  className="border-red-600 text-red-300 hover:bg-red-600 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* 分頁 */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-slate-400 text-sm">
                        顯示 {collectedData.data.length} 筆，共 {collectedData.total || 0} 筆數據
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                        >
                          上一頁
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md"
                        >
                          下一頁
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">貼文內容管理</CardTitle>
                <CardDescription className="text-slate-400">
                  管理收集的Facebook貼文數據
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  貼文管理功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">評論互動管理</CardTitle>
                <CardDescription className="text-slate-400">
                  管理收集的評論和互動數據
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  評論管理功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">用戶資料管理</CardTitle>
                <CardDescription className="text-slate-400">
                  管理收集的用戶檔案數據
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  用戶資料管理功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 詳細查看對話框 */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl rounded-xl">
            <DialogHeader>
              <DialogTitle>數據詳細信息</DialogTitle>
              <DialogDescription className="text-slate-400">
                查看收集數據的完整內容
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium">類型</label>
                  <p className="text-slate-100 mt-1">{selectedItem.type}</p>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium">內容</label>
                  <p className="text-slate-100 mt-1 bg-slate-700 p-3 rounded-lg">
                    {selectedItem.content}
                  </p>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium">來源</label>
                  <p className="text-slate-100 mt-1">{selectedItem.source || "Facebook"}</p>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-medium">收集時間</label>
                  <p className="text-slate-100 mt-1">
                    {new Date(selectedItem.createdAt).toLocaleString("zh-TW")}
                  </p>
                </div>
                {selectedItem.metadata && (
                  <div>
                    <label className="text-slate-300 text-sm font-medium">元數據</label>
                    <pre className="text-slate-100 mt-1 bg-slate-700 p-3 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedItem.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
