import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlayCircle, Settings, Users, Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

interface FacebookGenerationTask {
  id: number;
  name: string;
  type: string;
  status: string;
  targetCount: number;
  completedCount: number;
  settings: any;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface TaskSettings {
  // 基本帳號設定
  nameTemplate: string;
  emailTemplate: string;
  emailStrategy: string;
  emailDomains: string[];
  passwordTemplate: string;
  startingNumber: number;
  numberPadding: number;
  
  // 個人資料設定
  ageRange: { min: number; max: number };
  gender: string;
  location: string;
  interests: string[];
  profilePhotoType: string;
  coverPhotoType: string;
  bioStyle: string;
  
  // 安全與驗證設定
  phoneVerification: boolean;
  emailVerification: boolean;
  proxyRequired: boolean;
  userAgent: string;
  
  // 行為設定
  warmupPeriod: number;
  dailyActivityLimit: number;
  friendRequestDelay: number;
  postingSchedule: string;
}

export default function FacebookAccountGeneration() {
  const [activeTab, setActiveTab] = useState("create");
  const [newTaskName, setNewTaskName] = useState("");
  const [targetCount, setTargetCount] = useState(5);
  const [taskSettings, setTaskSettings] = useState<TaskSettings>({
    // 基本帳號設定
    nameTemplate: "User{number}",
    emailTemplate: "{name}@gmail.com", 
    emailStrategy: "template_only",
    emailDomains: ["gmail.com", "outlook.com", "yahoo.com"],
    passwordTemplate: "Pass{number}123!",
    startingNumber: 1,
    numberPadding: 3,
    
    // 個人資料設定
    ageRange: { min: 18, max: 35 },
    gender: "mixed",
    location: "taiwan",
    interests: [],
    profilePhotoType: "realistic",
    coverPhotoType: "landscape",
    bioStyle: "casual",
    
    // 安全與驗證設定
    phoneVerification: false,
    emailVerification: true,
    proxyRequired: true,
    userAgent: "auto",
    
    // 行為設定
    warmupPeriod: 7,
    dailyActivityLimit: 50,
    friendRequestDelay: 30,
    postingSchedule: "random"
  });
  const { toast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/facebook/generation-tasks"],
    refetchInterval: 2000,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest("/api/facebook/generation-tasks", {
        method: "POST",
        data: taskData,
      });
    },
    onSuccess: () => {
      toast({
        title: "任務創建成功",
        description: "Facebook 帳號生成任務已開始執行",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
      setNewTaskName("");
      setTargetCount(5);
    },
    onError: (error) => {
      toast({
        title: "任務創建失敗",
        description: "請檢查配置並重試",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest(`/api/facebook/generation-tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "任務已刪除",
        description: "Facebook 生成任務已成功刪除",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/generation-tasks"] });
    },
  });

  const handleCreateTask = () => {
    if (!newTaskName.trim()) {
      toast({
        title: "請輸入任務名稱",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      name: newTaskName,
      type: "account_generation",
      targetCount,
      settings: taskSettings,
    };

    createTaskMutation.mutate(taskData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "等待中" },
      running: { variant: "default" as const, label: "執行中" },
      completed: { variant: "success" as const, label: "已完成" },
      failed: { variant: "destructive" as const, label: "失敗" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const calculateProgress = (task: FacebookGenerationTask) => {
    if (task.status === "completed") return 100;
    if (task.status === "failed") return 0;
    return task.targetCount > 0 ? (task.completedCount / task.targetCount) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white">Facebook 帳號生成管理</h1>
          <p className="mt-2 text-gray-400">自動化 Facebook 帳號創建和配置管理</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900">
            <TabsTrigger value="create" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <PlayCircle className="mr-2 h-4 w-4" />
              創建任務
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              任務管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Settings className="mr-2 h-4 w-4" />
              系統設定
            </TabsTrigger>
          </TabsList>

          {/* 創建任務頁面 */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">創建新的生成任務</CardTitle>
                <CardDescription className="text-gray-400">
                  配置 Facebook 帳號生成參數和設定
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taskName" className="text-white">任務名稱</Label>
                      <Input
                        id="taskName"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="輸入任務名稱..."
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="targetCount" className="text-white">目標帳號數量</Label>
                      <Input
                        id="targetCount"
                        type="number"
                        value={targetCount}
                        onChange={(e) => setTargetCount(parseInt(e.target.value) || 5)}
                        min="1"
                        max="50"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    {/* 帳號命名設定 */}
                    <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
                      <Label className="text-white font-semibold">帳號命名設定</Label>
                      
                      <div>
                        <Label className="text-sm text-gray-300">用戶名模板</Label>
                        <Input
                          value={taskSettings.nameTemplate}
                          onChange={(e) => setTaskSettings(prev => ({...prev, nameTemplate: e.target.value}))}
                          placeholder="例如: User{number} 或 北金{number}"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">{`{number}會被序號替換，{random}會被隨機字符替換`}</p>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">郵箱處理策略</Label>
                        <Select
                          value={taskSettings.emailStrategy}
                          onValueChange={(value) => setTaskSettings(prev => ({...prev, emailStrategy: value}))}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="template_only">僅生成模板 (需手動創建)</SelectItem>
                            <SelectItem value="auto_create_gmail">自動創建 Gmail (需 API)</SelectItem>
                            <SelectItem value="auto_create_outlook">自動創建 Outlook (需 API)</SelectItem>
                            <SelectItem value="existing_pool">使用現有郵箱池</SelectItem>
                            <SelectItem value="temp_email">使用臨時郵箱服務</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">郵箱模板</Label>
                        <Input
                          value={taskSettings.emailTemplate}
                          onChange={(e) => setTaskSettings(prev => ({...prev, emailTemplate: e.target.value}))}
                          placeholder="例如: {name}@gmail.com"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {taskSettings.emailStrategy === 'template_only' && '生成郵箱地址格式，需要您手動創建這些郵箱'}
                          {taskSettings.emailStrategy === 'auto_create_gmail' && '系統會自動創建 Gmail 帳號 (需要 Gmail API 金鑰)'}
                          {taskSettings.emailStrategy === 'auto_create_outlook' && '系統會自動創建 Outlook 帳號 (需要 Microsoft API)'}
                          {taskSettings.emailStrategy === 'existing_pool' && '從您預先準備的郵箱池中隨機選擇'}
                          {taskSettings.emailStrategy === 'temp_email' && '使用臨時郵箱服務 (10分鐘有效期)'}
                        </p>
                      </div>

                      {(taskSettings.emailStrategy === 'template_only' || taskSettings.emailStrategy === 'existing_pool') && (
                        <div>
                          <Label className="text-sm text-gray-300">支援的郵箱網域</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {taskSettings.emailDomains.map((domain, index) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-600 px-3 py-1 rounded">
                                <span className="text-white text-sm">{domain}</span>
                                <button
                                  onClick={() => setTaskSettings(prev => ({
                                    ...prev,
                                    emailDomains: prev.emailDomains.filter((_, i) => i !== index)
                                  }))}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="新增郵箱網域 (例如: yahoo.com)"
                              className="bg-gray-700 border-gray-600 text-white flex-1"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const value = e.currentTarget.value.trim();
                                  if (value && !taskSettings.emailDomains.includes(value)) {
                                    setTaskSettings(prev => ({
                                      ...prev,
                                      emailDomains: [...prev.emailDomains, value]
                                    }));
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm text-gray-300">密碼模板</Label>
                        <Input
                          value={taskSettings.passwordTemplate}
                          onChange={(e) => setTaskSettings(prev => ({...prev, passwordTemplate: e.target.value}))}
                          placeholder="例如: Pass{number}123!"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-300">起始序號</Label>
                          <Input
                            type="number"
                            value={taskSettings.startingNumber}
                            onChange={(e) => setTaskSettings(prev => ({...prev, startingNumber: parseInt(e.target.value) || 1}))}
                            min="1"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">序號位數</Label>
                          <Input
                            type="number"
                            value={taskSettings.numberPadding}
                            onChange={(e) => setTaskSettings(prev => ({...prev, numberPadding: parseInt(e.target.value) || 3}))}
                            min="1"
                            max="5"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-1">例如: 3位數 = 001, 002, 003</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">年齡範圍</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={taskSettings.ageRange.min}
                          onChange={(e) => setTaskSettings(prev => ({
                            ...prev,
                            ageRange: { ...prev.ageRange, min: parseInt(e.target.value) || 18 }
                          }))}
                          placeholder="最小年齡"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          type="number"
                          value={taskSettings.ageRange.max}
                          onChange={(e) => setTaskSettings(prev => ({
                            ...prev,
                            ageRange: { ...prev.ageRange, max: parseInt(e.target.value) || 35 }
                          }))}
                          placeholder="最大年齡"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">性別分布</Label>
                      <Select
                        value={taskSettings.gender}
                        onValueChange={(value) => setTaskSettings(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="mixed">混合</SelectItem>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">地理位置</Label>
                      <Select
                        value={taskSettings.location}
                        onValueChange={(value) => setTaskSettings(prev => ({ ...prev, location: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="taiwan">台灣</SelectItem>
                          <SelectItem value="hongkong">香港</SelectItem>
                          <SelectItem value="singapore">新加坡</SelectItem>
                          <SelectItem value="malaysia">馬來西亞</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 安全與驗證設定 */}
                    <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
                      <Label className="text-white font-semibold">安全與驗證設定</Label>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-300">手機號碼驗證</Label>
                        <Switch
                          checked={taskSettings.phoneVerification}
                          onCheckedChange={(checked) => setTaskSettings(prev => ({...prev, phoneVerification: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-300">郵箱驗證</Label>
                        <Switch
                          checked={taskSettings.emailVerification}
                          onCheckedChange={(checked) => setTaskSettings(prev => ({...prev, emailVerification: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-300">代理IP要求</Label>
                        <Switch
                          checked={taskSettings.proxyRequired}
                          onCheckedChange={(checked) => setTaskSettings(prev => ({...prev, proxyRequired: checked}))}
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">用戶代理</Label>
                        <Select
                          value={taskSettings.userAgent}
                          onValueChange={(value) => setTaskSettings(prev => ({...prev, userAgent: value}))}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="auto">自動檢測</SelectItem>
                            <SelectItem value="chrome">Chrome 瀏覽器</SelectItem>
                            <SelectItem value="firefox">Firefox 瀏覽器</SelectItem>
                            <SelectItem value="safari">Safari 瀏覽器</SelectItem>
                            <SelectItem value="mobile">移動設備</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 行為設定 */}
                    <div className="space-y-3 p-4 bg-gray-800 rounded-lg">
                      <Label className="text-white font-semibold">行為設定</Label>
                      
                      <div>
                        <Label className="text-sm text-gray-300">暖機期間 (天)</Label>
                        <Input
                          type="number"
                          value={taskSettings.warmupPeriod}
                          onChange={(e) => setTaskSettings(prev => ({...prev, warmupPeriod: parseInt(e.target.value) || 7}))}
                          min="1"
                          max="30"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">每日活動限制</Label>
                        <Input
                          type="number"
                          value={taskSettings.dailyActivityLimit}
                          onChange={(e) => setTaskSettings(prev => ({...prev, dailyActivityLimit: parseInt(e.target.value) || 50}))}
                          min="10"
                          max="200"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">好友請求延遲 (分鐘)</Label>
                        <Input
                          type="number"
                          value={taskSettings.friendRequestDelay}
                          onChange={(e) => setTaskSettings(prev => ({...prev, friendRequestDelay: parseInt(e.target.value) || 30}))}
                          min="5"
                          max="120"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-gray-300">發文排程</Label>
                        <Select
                          value={taskSettings.postingSchedule}
                          onValueChange={(value) => setTaskSettings(prev => ({...prev, postingSchedule: value}))}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="random">隨機時間</SelectItem>
                            <SelectItem value="morning">早上時段</SelectItem>
                            <SelectItem value="afternoon">下午時段</SelectItem>
                            <SelectItem value="evening">晚上時段</SelectItem>
                            <SelectItem value="peak">高峰時段</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">頭像類型</Label>
                      <Select
                        value={taskSettings.profilePhotoType}
                        onValueChange={(value) => setTaskSettings(prev => ({ ...prev, profilePhotoType: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="realistic">真實照片</SelectItem>
                          <SelectItem value="generated">AI 生成</SelectItem>
                          <SelectItem value="avatar">卡通頭像</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">個人簡介風格</Label>
                      <Select
                        value={taskSettings.bioStyle}
                        onValueChange={(value) => setTaskSettings(prev => ({ ...prev, bioStyle: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="casual">輕鬆隨意</SelectItem>
                          <SelectItem value="professional">專業正式</SelectItem>
                          <SelectItem value="creative">創意有趣</SelectItem>
                          <SelectItem value="minimal">簡約風格</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-white">需要手機驗證</Label>
                      <Switch
                        checked={taskSettings.verificationRequired}
                        onCheckedChange={(checked) => setTaskSettings(prev => ({ ...prev, verificationRequired: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white">興趣標籤 (一行一個)</Label>
                  <Textarea
                    value={taskSettings.interests.join('\n')}
                    onChange={(e) => setTaskSettings(prev => ({
                      ...prev,
                      interests: e.target.value.split('\n').filter(i => i.trim())
                    }))}
                    placeholder="科技&#10;旅遊&#10;美食&#10;音樂&#10;運動"
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {createTaskMutation.isPending ? "創建中..." : "開始生成任務"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 任務管理頁面 */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-6">
              {tasksLoading ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-center text-gray-400">載入任務列表...</div>
                  </CardContent>
                </Card>
              ) : tasks.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="text-center text-gray-400">尚未創建任何生成任務</div>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task: FacebookGenerationTask) => (
                  <Card key={task.id} className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{task.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            目標: {task.targetCount} 個帳號 • 已完成: {task.completedCount}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(task.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">進度</span>
                          <span className="text-white">
                            {task.completedCount}/{task.targetCount} ({Math.round(calculateProgress(task))}%)
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(task)}
                          className="h-2 bg-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">創建時間:</span>
                          <div className="text-white">
                            {new Date(task.createdAt).toLocaleString('zh-TW')}
                          </div>
                        </div>
                        {task.startedAt && (
                          <div>
                            <span className="text-gray-400">開始時間:</span>
                            <div className="text-white">
                              {new Date(task.startedAt).toLocaleString('zh-TW')}
                            </div>
                          </div>
                        )}
                        {task.completedAt && (
                          <div>
                            <span className="text-gray-400">完成時間:</span>
                            <div className="text-white">
                              {new Date(task.completedAt).toLocaleString('zh-TW')}
                            </div>
                          </div>
                        )}
                      </div>

                      {task.settings && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t border-gray-800">
                          <div>
                            <span className="text-gray-400">年齡範圍:</span>
                            <div className="text-white">
                              {task.settings.ageRange?.min || 18}-{task.settings.ageRange?.max || 35}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">性別:</span>
                            <div className="text-white">{task.settings.gender || "混合"}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">地區:</span>
                            <div className="text-white">{task.settings.location || "台灣"}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">驗證:</span>
                            <div className="text-white">
                              {task.settings.verificationRequired ? "需要" : "不需要"}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* 系統設定頁面 */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">生成系統設定</CardTitle>
                <CardDescription className="text-gray-400">
                  配置帳號生成的全域參數和限制
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">每日生成限制</Label>
                      <Input
                        type="number"
                        defaultValue="20"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">並發任務數量</Label>
                      <Input
                        type="number"
                        defaultValue="3"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">失敗重試次數</Label>
                      <Input
                        type="number"
                        defaultValue="3"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">任務超時時間 (分鐘)</Label>
                      <Input
                        type="number"
                        defaultValue="30"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}