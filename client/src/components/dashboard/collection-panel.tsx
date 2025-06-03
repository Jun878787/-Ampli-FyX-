import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CollectionSettings {
  type: string;
  targetCount: number;
  keywords: string;
  timeRange: number;
  includeImages: boolean;
  includeVideos: boolean;
}

export default function CollectionPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<CollectionSettings>({
    type: "posts",
    targetCount: 1000,
    keywords: "",
    timeRange: 7,
    includeImages: false,
    includeVideos: false,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "設置已保存",
        description: "數據採集任務已創建成功",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "保存失敗",
        description: "無法創建數據採集任務",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const taskData = {
      name: `${settings.type} 採集 - ${new Date().toLocaleDateString()}`,
      type: settings.type,
      status: "pending",
      targetCount: settings.targetCount,
      keywords: settings.keywords,
      timeRange: settings.timeRange,
      includeImages: settings.includeImages,
      includeVideos: settings.includeVideos,
      progress: 0,
    };

    createTaskMutation.mutate(taskData);
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">數據採集設置</CardTitle>
        <p className="text-slate-600 mt-1">配置採集參數和目標</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="collection-type" className="text-sm font-medium text-slate-700 mb-2">
              採集類型
            </Label>
            <Select
              value={settings.type}
              onValueChange={(value) => setSettings({ ...settings, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posts">貼文內容</SelectItem>
                <SelectItem value="comments">評論數據</SelectItem>
                <SelectItem value="profiles">用戶資料</SelectItem>
                <SelectItem value="groups">群組信息</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="target-count" className="text-sm font-medium text-slate-700 mb-2">
              目標數量
            </Label>
            <Input
              id="target-count"
              type="number"
              placeholder="1000"
              value={settings.targetCount}
              onChange={(e) => setSettings({ ...settings, targetCount: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <Label htmlFor="keywords" className="text-sm font-medium text-slate-700 mb-2">
              關鍵字
            </Label>
            <Input
              id="keywords"
              placeholder="輸入搜索關鍵字"
              value={settings.keywords}
              onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="time-range" className="text-sm font-medium text-slate-700 mb-2">
              時間範圍
            </Label>
            <Select
              value={settings.timeRange.toString()}
              onValueChange={(value) => setSettings({ ...settings, timeRange: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">最近 7 天</SelectItem>
                <SelectItem value="30">最近 30 天</SelectItem>
                <SelectItem value="90">最近 3 個月</SelectItem>
                <SelectItem value="365">最近 1 年</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-images"
                checked={settings.includeImages}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, includeImages: checked as boolean })
                }
              />
              <Label htmlFor="include-images" className="text-sm text-slate-700">
                包含圖片
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-videos"
                checked={settings.includeVideos}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, includeVideos: checked as boolean })
                }
              />
              <Label htmlFor="include-videos" className="text-sm text-slate-700">
                包含影片
              </Label>
            </div>
          </div>
          <Button 
            onClick={handleSaveSettings}
            disabled={createTaskMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createTaskMutation.isPending ? "保存中..." : "保存設置"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
