import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Bot, MessageCircle, Settings, Play, Pause, Clock, Users, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const messageTemplateSchema = z.object({
  templateName: z.string().min(1, "模板名稱為必填"),
  messageType: z.enum(["greeting", "follow_up", "promotional", "customer_service"]),
  content: z.string().min(1, "訊息內容為必填"),
  variables: z.array(z.string()).optional(),
  language: z.enum(["zh-TW", "zh-CN", "en", "ja", "ko"]).default("zh-TW"),
  isActive: z.boolean().default(true),
});

const autoReplyRuleSchema = z.object({
  ruleName: z.string().min(1, "規則名稱為必填"),
  accountId: z.number().min(1, "請選擇帳號"),
  triggerKeywords: z.array(z.string()).min(1, "請至少設定一個觸發關鍵字"),
  responseType: z.enum(["template", "smart_reply", "forward"]),
  templateId: z.number().optional(),
  smartReplyPrompt: z.string().optional(),
  forwardToAccount: z.number().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
});

type MessageTemplateForm = z.infer<typeof messageTemplateSchema>;
type AutoReplyRuleForm = z.infer<typeof autoReplyRuleSchema>;

export default function AutoMessaging() {
  const [selectedTab, setSelectedTab] = useState("templates");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: messageTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/facebook/message-templates"],
  });

  const { data: autoReplyRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["/api/facebook/auto-reply-rules"],
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/facebook/accounts"],
  });

  const templateForm = useForm<MessageTemplateForm>({
    resolver: zodResolver(messageTemplateSchema),
    defaultValues: {
      templateName: "",
      messageType: "greeting",
      content: "",
      variables: [],
      language: "zh-TW",
      isActive: true,
    },
  });

  const ruleForm = useForm<AutoReplyRuleForm>({
    resolver: zodResolver(autoReplyRuleSchema),
    defaultValues: {
      ruleName: "",
      accountId: 0,
      triggerKeywords: [],
      responseType: "template",
      isActive: true,
      priority: 5,
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: MessageTemplateForm) => {
      return await apiRequest("/api/facebook/message-templates", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/message-templates"] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: AutoReplyRuleForm) => {
      return await apiRequest("/api/facebook/auto-reply-rules", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facebook/auto-reply-rules"] });
      setIsRuleDialogOpen(false);
      ruleForm.reset();
    },
  });

  const onCreateTemplate = (data: MessageTemplateForm) => {
    createTemplateMutation.mutate(data);
  };

  const onCreateRule = (data: AutoReplyRuleForm) => {
    createRuleMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">自動化訊息系統</h1>
            <p className="text-slate-400 mt-2">北金國際North™Sea - 智能回覆與批量訊息管理</p>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">訊息模板</p>
                  <p className="text-2xl font-bold text-slate-100">{messageTemplates.length}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">自動回覆規則</p>
                  <p className="text-2xl font-bold text-slate-100">{autoReplyRules.length}</p>
                </div>
                <Bot className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">今日處理訊息</p>
                  <p className="text-2xl font-bold text-slate-100">1,247</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">回覆成功率</p>
                  <p className="text-2xl font-bold text-slate-100">98.5%</p>
                </div>
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-slate-800 rounded-xl">
            <TabsTrigger value="templates" className="rounded-lg">訊息模板</TabsTrigger>
            <TabsTrigger value="auto-reply" className="rounded-lg">自動回覆</TabsTrigger>
            <TabsTrigger value="group-messages" className="rounded-lg">群組訊息</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">數據分析</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">訊息模板管理</CardTitle>
                  <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        新增模板
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl rounded-xl">
                      <DialogHeader>
                        <DialogTitle>建立訊息模板</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          設定可重複使用的訊息模板，支援變數替換
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...templateForm}>
                        <form onSubmit={templateForm.handleSubmit(onCreateTemplate)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={templateForm.control}
                              name="templateName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">模板名稱</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="例：歡迎訊息"
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={templateForm.control}
                              name="messageType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">訊息類型</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      <SelectItem value="greeting">歡迎訊息</SelectItem>
                                      <SelectItem value="follow_up">追蹤訊息</SelectItem>
                                      <SelectItem value="promotional">促銷訊息</SelectItem>
                                      <SelectItem value="customer_service">客服訊息</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={templateForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">訊息內容</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="輸入訊息內容，可使用 {{name}} 等變數"
                                    className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg min-h-[120px]"
                                  />
                                </FormControl>
                                <FormDescription className="text-slate-400">
                                  支援變數：{"{name}"}, {"{company}"}, {"{product}"} 等
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={templateForm.control}
                              name="language"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">語言</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      <SelectItem value="zh-TW">繁體中文</SelectItem>
                                      <SelectItem value="zh-CN">簡體中文</SelectItem>
                                      <SelectItem value="en">English</SelectItem>
                                      <SelectItem value="ja">日本語</SelectItem>
                                      <SelectItem value="ko">한국어</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={templateForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-3 shadow-sm bg-slate-700">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-slate-200">啟用模板</FormLabel>
                                    <FormDescription className="text-slate-400 text-sm">
                                      立即可用於自動回覆
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
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
                              onClick={() => setIsTemplateDialogOpen(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                              取消
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTemplateMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                              {createTemplateMutation.isPending ? "建立中..." : "建立模板"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="text-center text-slate-400 py-8">載入中...</div>
                ) : messageTemplates.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">尚無訊息模板</div>
                ) : (
                  <div className="grid gap-4">
                    {Array.isArray(messageTemplates) && messageTemplates.map((template: any) => (
                      <Card key={template.id} className="bg-slate-700/50 border-slate-600 rounded-lg">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-slate-100">{template.templateName}</h3>
                                <Badge
                                  variant={template.isActive ? "default" : "secondary"}
                                  className={`rounded-md ${
                                    template.isActive 
                                      ? "bg-green-600 text-white" 
                                      : "bg-slate-600 text-slate-300"
                                  }`}
                                >
                                  {template.isActive ? "啟用" : "停用"}
                                </Badge>
                                <Badge variant="outline" className="border-slate-600 text-slate-300 rounded-md">
                                  {template.messageType}
                                </Badge>
                              </div>
                              <p className="text-slate-300 text-sm mb-2">{template.content}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>語言: {template.language}</span>
                                <span>使用次數: {template.usageCount || 0}</span>
                                <span>建立時間: {new Date(template.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                                編輯
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                                預覽
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto-reply">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100">自動回覆規則</CardTitle>
                  <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 rounded-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        新增規則
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-2xl rounded-xl">
                      <DialogHeader>
                        <DialogTitle>建立自動回覆規則</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          設定智能回覆規則，根據關鍵字自動回應訊息
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...ruleForm}>
                        <form onSubmit={ruleForm.handleSubmit(onCreateRule)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ruleForm.control}
                              name="ruleName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">規則名稱</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="例：價格詢問自動回覆"
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ruleForm.control}
                              name="accountId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">適用帳號</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                        <SelectValue placeholder="選擇帳號" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                      {Array.isArray(accounts) && accounts.map((account: any) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                          {account.accountName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={ruleForm.control}
                            name="triggerKeywords"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">觸發關鍵字</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="輸入關鍵字，用逗號分隔"
                                    className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    onChange={(e) => {
                                      const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                                      field.onChange(keywords);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className="text-slate-400">
                                  例：價格,費用,多少錢,報價
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={ruleForm.control}
                            name="responseType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">回覆類型</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-slate-800 border-slate-700 rounded-lg">
                                    <SelectItem value="template">使用模板</SelectItem>
                                    <SelectItem value="smart_reply">智能回覆</SelectItem>
                                    <SelectItem value="forward">轉發訊息</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ruleForm.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-200">優先級 (1-10)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={10}
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      className="bg-slate-700 border-slate-600 text-slate-100 rounded-lg"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-slate-400">
                                    數字越大優先級越高
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ruleForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-600 p-3 shadow-sm bg-slate-700">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-slate-200">啟用規則</FormLabel>
                                    <FormDescription className="text-slate-400 text-sm">
                                      立即生效
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
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
                              onClick={() => setIsRuleDialogOpen(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                              取消
                            </Button>
                            <Button
                              type="submit"
                              disabled={createRuleMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 rounded-lg"
                            >
                              {createRuleMutation.isPending ? "建立中..." : "建立規則"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="text-center text-slate-400 py-8">載入中...</div>
                ) : autoReplyRules.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">尚無自動回覆規則</div>
                ) : (
                  <div className="grid gap-4">
                    {Array.isArray(autoReplyRules) && autoReplyRules.map((rule: any) => (
                      <Card key={rule.id} className="bg-slate-700/50 border-slate-600 rounded-lg">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-slate-100">{rule.ruleName}</h3>
                                <Badge
                                  variant={rule.isActive ? "default" : "secondary"}
                                  className={`rounded-md ${
                                    rule.isActive 
                                      ? "bg-green-600 text-white" 
                                      : "bg-slate-600 text-slate-300"
                                  }`}
                                >
                                  {rule.isActive ? "啟用" : "停用"}
                                </Badge>
                                <Badge variant="outline" className="border-slate-600 text-slate-300 rounded-md">
                                  優先級: {rule.priority}
                                </Badge>
                              </div>
                              <div className="text-slate-300 text-sm mb-2">
                                <span className="text-slate-400">觸發關鍵字: </span>
                                {rule.triggerKeywords?.join(", ")}
                              </div>
                              <div className="text-slate-300 text-sm mb-2">
                                <span className="text-slate-400">回覆類型: </span>
                                {rule.responseType}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>觸發次數: {rule.triggerCount || 0}</span>
                                <span>成功率: {rule.successRate || "100%"}</span>
                                <span>建立時間: {new Date(rule.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                                編輯
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600 rounded-md">
                                測試
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group-messages">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">群組訊息管理</CardTitle>
                <CardDescription className="text-slate-400">
                  批量發送訊息到指定群組或好友列表
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  群組訊息功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-slate-800/50 border-slate-700 rounded-xl">
              <CardHeader>
                <CardTitle className="text-slate-100">訊息數據分析</CardTitle>
                <CardDescription className="text-slate-400">
                  訊息發送統計、回覆率分析與效果追蹤
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-400 py-8">
                  數據分析功能開發中...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}