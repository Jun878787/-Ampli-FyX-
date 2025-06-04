import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Hash, 
  User,
  MapPin,
  Zap,
  Database,
  ArrowRight,
  Target,
  TrendingUp
} from "lucide-react";

const collectionModules = [
  {
    id: "fan-page",
    title: "粉絲團採集",
    description: "採集競爭對手粉絲團數據，獲取受眾 Facebook ID",
    icon: Users,
    color: "blue",
    route: "/fan-page-collection",
    features: ["關鍵字搜索", "連結輸入", "粉絲數據", "城市定位"]
  },
  {
    id: "keyword",
    title: "關鍵詞彙採集",
    description: "多關鍵字內容採集，分析發布者和互動數據",
    icon: Hash,
    color: "green",
    route: "/keyword-collection",
    features: ["批量關鍵字", "內容分析", "發布者ID", "互動統計"]
  },
  {
    id: "group",
    title: "指定社團採集",
    description: "採集目標社團成員和活動數據",
    icon: Users,
    color: "purple",
    route: "/group-collection",
    features: ["社團搜索", "成員統計", "公開/私密", "連結採集"]
  },
  {
    id: "person",
    title: "指定人物採集",
    description: "採集特定人物檔案和追蹤者數據",
    icon: User,
    color: "orange",
    route: "/person-collection",
    features: ["人物搜索", "檔案分析", "追蹤數據", "活動記錄"]
  },
  {
    id: "region",
    title: "指定地區採集",
    description: "台灣地區定向採集，精準地理定位",
    icon: MapPin,
    color: "teal",
    route: "/region-collection",
    features: ["台灣地區", "地理定位", "區域分析", "本地數據"]
  },
  {
    id: "ad",
    title: "指定廣告採集",
    description: "競爭對手廣告策略分析，獲取投放數據",
    icon: Zap,
    color: "yellow",
    route: "/ad-collection",
    features: ["廣告分析", "投放策略", "預算追蹤", "受眾定位"]
  }
];

const colorClasses = {
  blue: {
    bg: "bg-blue-900/20",
    border: "border-blue-600",
    text: "text-blue-400",
    hover: "hover:bg-blue-900/30"
  },
  green: {
    bg: "bg-green-900/20",
    border: "border-green-600",
    text: "text-green-400",
    hover: "hover:bg-green-900/30"
  },
  purple: {
    bg: "bg-purple-900/20",
    border: "border-purple-600",
    text: "text-purple-400",
    hover: "hover:bg-purple-900/30"
  },
  orange: {
    bg: "bg-orange-900/20",
    border: "border-orange-600",
    text: "text-orange-400",
    hover: "hover:bg-orange-900/30"
  },
  teal: {
    bg: "bg-teal-900/20",
    border: "border-teal-600",
    text: "text-teal-400",
    hover: "hover:bg-teal-900/30"
  },
  yellow: {
    bg: "bg-yellow-900/20",
    border: "border-yellow-600",
    text: "text-yellow-400",
    hover: "hover:bg-yellow-900/30"
  }
};

export default function DataCollection() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 頁面標題 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Database className="h-10 w-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">數據採集中心</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            專業的 Facebook 數據採集平台，提供 6 種精準採集模組，
            助您獲取競爭對手受眾數據，制定精準廣告投放策略
          </p>
        </div>

        {/* 業務說明 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-400" />
              競爭情報採集策略
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">應用場景示例</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• <strong className="text-blue-400">熊貓外送競爭分析：</strong>搜索 "UBER EATS" 獲取其受眾群體</p>
                  <p>• <strong className="text-green-400">地區精準投放：</strong>台北地區美食外送目標客群</p>
                  <p>• <strong className="text-purple-400">社團營銷：</strong>相關美食討論社團成員數據</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">數據用途</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• <strong className="text-orange-400">受眾建立：</strong>收集 Facebook ID 建立自訂受眾</p>
                  <p>• <strong className="text-teal-400">廣告優化：</strong>分析競爭對手投放策略</p>
                  <p>• <strong className="text-yellow-400">市場研究：</strong>了解目標市場用戶行為</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 採集模組網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionModules.map((module) => {
            const IconComponent = module.icon;
            const colors = colorClasses[module.color as keyof typeof colorClasses];
            
            return (
              <Card 
                key={module.id}
                className={`bg-gray-800/50 border-gray-700 ${colors.hover} transition-all duration-200 cursor-pointer group`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                      <IconComponent className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white group-hover:text-gray-100">
                        {module.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-300 text-sm leading-relaxed">
                    {module.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-200">功能特色:</h4>
                    <div className="flex flex-wrap gap-1">
                      {module.features.map((feature, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 text-xs rounded ${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={module.route}>
                    <Button 
                      className={`w-full ${colors.bg} ${colors.border} ${colors.text} border ${colors.hover} hover:text-white`}
                      variant="outline"
                    >
                      開始採集
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 統計總覽 */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              採集績效概覽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-400">2,847</div>
                <div className="text-sm text-gray-300">粉絲團數據</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-400">5,692</div>
                <div className="text-sm text-gray-300">關鍵詞內容</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-400">1,234</div>
                <div className="text-sm text-gray-300">社團成員</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-400">892</div>
                <div className="text-sm text-gray-300">廣告分析</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}