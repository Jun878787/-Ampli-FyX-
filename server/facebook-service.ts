interface FacebookAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookPageInfo {
  id: string;
  name: string;
  category: string;
  followers_count?: number;
  likes?: number;
}

class FacebookService {
  private apiKey: string;
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    // Facebook應用程式憑證
    this.appId = '2213169895810612';
    this.appSecret = 'f83b0f49d07b550f65d69354659fc2dd';
    this.apiKey = 'EAAfc3cV3pjQBO2VcefM704jkOe4DptOucFGZCVi0AB0luQHkCPmSUR3yQQCkZAajI7iHkynIHZAupmNYGbl6T5DRUedDlTScAi1OUZCkY9PYUxrkuj2Dv6NdboE8cjqOGo47OGo5cFqKN98qCcL8Ir0bwgjbxDkLpDuCrG7F7YY34m4rIstYXEfaCqIMrsTIfjsaqZAqesw3AcRD9tJLbLEGbuZBTxXmiHfSZBnOTtDhW4Bf851GDBF';
    if (!this.apiKey) {
      console.warn('Facebook API key not found in environment variables');
    }
    
    // 注册令牌刷新回调，当令牌刷新时更新服务中的apiKey
    import('./facebook-api-manager.js').then(({ facebookAPIManager }) => {
      facebookAPIManager.registerTokenRefreshCallback((configId, newToken) => {
        if (configId === 'main') {
          this.apiKey = newToken;
          console.log('[FacebookService] 已更新主要API令牌');
        }
      });
    }).catch(err => {
      console.error('[FacebookService] 无法注册令牌刷新回调:', err);
    });
  }

  async testConnection(): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/me?access_token=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            connected: true,
            app_id: data.id || 'Connected',
            message: 'Facebook Graph API connection successful'
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to connect to Facebook API'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error connecting to Facebook API'
      };
    }
  }

  async getUserInfo(userId?: string): Promise<FacebookAPIResponse> {
    try {
      const targetId = userId || 'me';
      const response = await fetch(
        `${this.baseUrl}/${targetId}?fields=id,name,email,picture&access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data as FacebookUser
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to fetch user info'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error fetching user info'
      };
    }
  }

  async getPageInfo(pageId: string): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}?fields=id,name,category,followers_count,likes&access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data as FacebookPageInfo
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to fetch page info'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error fetching page info'
      };
    }
  }

  async searchPages(query: string, limit: number = 10): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=page&limit=${limit}&access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            pages: data.data || [],
            count: data.data?.length || 0
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to search pages'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error searching pages'
      };
    }
  }

  async getPagePosts(pageId: string, limit: number = 25): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=${limit}&access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            posts: data.data || [],
            count: data.data?.length || 0,
            paging: data.paging
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to fetch page posts'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error fetching page posts'
      };
    }
  }

  async validateAccessToken(): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/debug_token?input_token=${this.apiKey}&access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      if (response.ok && data.data) {
        const expiresAt = data.data.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = expiresAt ? expiresAt - now : 0;
        const expiresInDays = expiresIn > 0 ? (expiresIn / (24 * 60 * 60)).toFixed(1) : '未知';
        
        return {
          success: true,
          data: {
            valid: data.data.is_valid || false,
            app_id: data.data.app_id,
            expires_at: data.data.expires_at,
            expires_in: expiresIn,
            expires_in_days: expiresInDays,
            scopes: data.data.scopes || [],
            user_id: data.data.user_id
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Invalid access token'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error validating token'
      };
    }
  }
  
  /**
   * 获取长期访问令牌
   */
  async getLongLivedToken(shortLivedToken?: string): Promise<FacebookAPIResponse> {
    try {
      const tokenToExchange = shortLivedToken || this.apiKey;
      
      const response = await fetch(
        `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${tokenToExchange}`
      );
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        // 如果没有提供短期令牌，则更新当前服务的apiKey
        if (!shortLivedToken) {
          this.apiKey = data.access_token;
        }
        
        return {
          success: true,
          data: {
            access_token: data.access_token,
            token_type: data.token_type || 'bearer',
            expires_in: data.expires_in
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || '获取长期令牌失败'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取长期令牌时发生网络错误'
      };
    }
  }

  // 廣告內容提取功能
  async getAdContents(params: {
    accountId: string;
    campaignId: string;
    contentType: string;
    searchQuery: string;
    startDate: string;
    endDate: string;
  }): Promise<FacebookAPIResponse> {
    try {
      const { accountId, campaignId, contentType, searchQuery, startDate, endDate } = params;
      
      // 構建Facebook Graph API查詢
      let fields = 'id,name,adcreatives{object_story_spec,title,body,call_to_action_type,image_url,video_id,link_url}';
      fields += ',insights{impressions,clicks,ctr,cpc,spend,reach,frequency}';
      fields += ',targeting{age_min,age_max,genders,geo_locations,interests,behaviors}';
      
      let url = `${this.baseUrl}/act_${accountId}/ads?fields=${fields}&access_token=${this.apiKey}`;
      
      if (campaignId && campaignId !== 'all') {
        url += `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${campaignId}"}]`;
      }
      
      if (startDate && endDate) {
        url += `&time_range={"since":"${startDate}","until":"${endDate}"}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `無法獲取廣告內容: HTTP ${response.status}`
        };
      }

      const data = await response.json();
      
      // 處理和格式化廣告內容數據
      const processedAds = data.data?.map((ad: any) => {
        const creative = ad.adcreatives?.data?.[0];
        const insights = ad.insights?.data?.[0];
        const targeting = ad.targeting;
        
        return {
          id: ad.id,
          adId: ad.id,
          name: ad.name,
          // 文章標題
          headline: creative?.title || creative?.object_story_spec?.link_data?.name || '無標題',
          // 內容
          primaryText: creative?.body || creative?.object_story_spec?.link_data?.description || '無內容',
          description: creative?.object_story_spec?.link_data?.caption || '',
          callToAction: creative?.call_to_action_type || '了解更多',
          contentType: this.determineContentType(creative),
          imageUrl: creative?.image_url,
          videoId: creative?.video_id,
          linkUrl: creative?.link_url || creative?.object_story_spec?.link_data?.link,
          
          // 花費數據
          impressions: insights?.impressions || 0,
          clicks: insights?.clicks || 0,
          ctr: insights?.ctr || 0,
          cpc: insights?.cpc || 0,
          spend: insights?.spend || 0, // 花費
          reach: insights?.reach || 0,
          frequency: insights?.frequency || 0,
          
          // 受眾分析
          audienceAnalysis: {
            ageRange: targeting ? `${targeting.age_min || 18}-${targeting.age_max || 65}` : '18-65',
            genders: targeting?.genders || ['all'],
            locations: targeting?.geo_locations?.countries || [],
            interests: targeting?.interests?.map((i: any) => i.name) || [],
            behaviors: targeting?.behaviors?.map((b: any) => b.name) || [],
          },
          
          // 潛在客戶分析
          potentialCustomers: {
            estimatedReach: insights?.reach || 0,
            engagementRate: insights?.clicks && insights?.impressions ? 
              ((insights.clicks / insights.impressions) * 100).toFixed(2) : '0',
            costPerLead: insights?.spend && insights?.clicks ? 
              (insights.spend / insights.clicks).toFixed(2) : '0',
            qualityScore: this.calculateQualityScore(insights),
          },
          
          status: 'ACTIVE',
          createdAt: ad.created_time || new Date().toISOString(),
        };
      }) || [];

      // 應用篩選
      let filteredAds = processedAds;
      
      if (contentType && contentType !== 'all') {
        filteredAds = filteredAds.filter((ad: any) => ad.contentType === contentType);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredAds = filteredAds.filter((ad: any) => 
          ad.headline.toLowerCase().includes(query) ||
          ad.primaryText.toLowerCase().includes(query) ||
          ad.name.toLowerCase().includes(query)
        );
      }

      return {
        success: true,
        data: filteredAds
      };
    } catch (error) {
      return {
        success: false,
        error: `提取廣告內容失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  async extractAdContents(params: {
    accountId: string;
    campaignId: string;
    dateRange: { from: Date; to: Date };
  }): Promise<FacebookAPIResponse> {
    try {
      const { accountId, campaignId, dateRange } = params;
      
      // 調用getAdContents來提取最新數據
      const result = await this.getAdContents({
        accountId,
        campaignId,
        contentType: 'all',
        searchQuery: '',
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0],
      });

      if (result.success) {
        return {
          success: true,
          data: {
            extracted: result.data?.length || 0,
            updated: result.data?.length || 0,
          }
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: `提取廣告內容失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  async exportAdContents(format: string, params?: { accountId?: string; campaignId?: string; startDate?: string; endDate?: string; }): Promise<FacebookAPIResponse> {
    try {
      // 獲取廣告內容數據
      const accountId = params?.accountId || '';
      const campaignId = params?.campaignId || 'all';
      const startDate = params?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = params?.endDate || new Date().toISOString().split('T')[0];
      
      // 獲取廣告內容數據
      const adContentsResult = await this.getAdContents({
        accountId,
        campaignId,
        contentType: 'all',
        searchQuery: '',
        startDate,
        endDate
      });
      
      if (!adContentsResult.success) {
        return {
          success: false,
          error: adContentsResult.error || '獲取廣告內容數據失敗'
        };
      }
      
      // 確保數據存在
      if (!adContentsResult.data || adContentsResult.data.length === 0) {
        return {
          success: false,
          error: '沒有找到廣告內容數據'
        };
      }
      
      // 創建臨時JSON文件
      const fs = require('fs');
      const path = require('path');
      const { spawn } = require('child_process');
      const os = require('os');
      
      // 創建下載目錄
      const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      // 創建臨時目錄
      const tempDir = path.join(os.tmpdir(), 'fbdataminer');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // 生成臨時文件名
      const timestamp = Date.now();
      const tempJsonFile = path.join(tempDir, `ad_contents_${timestamp}.json`);
      
      // 寫入JSON數據
      fs.writeFileSync(tempJsonFile, JSON.stringify(adContentsResult.data), 'utf8');
      
      // 準備Python腳本路徑
      const scriptPath = path.join(__dirname, '..', 'export_ad_contents.py');
      
      // 執行Python腳本
      return new Promise((resolve) => {
        const exportFormat = format.toLowerCase() === 'csv' ? 'csv' : 'excel';
        const pythonProcess = spawn('python', [
          scriptPath,
          '--input', tempJsonFile,
          '--format', exportFormat,
          '--output', downloadsDir
        ]);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          // 刪除臨時JSON文件
          try {
            fs.unlinkSync(tempJsonFile);
          } catch (e) {
            console.error('刪除臨時文件失敗:', e);
          }
          
          if (code !== 0) {
            console.error(`Python腳本執行失敗，退出碼: ${code}`);
            console.error(`錯誤輸出: ${errorData}`);
            
            resolve({
              success: false,
              error: `導出廣告內容失敗: Python腳本執行錯誤 (${errorData.trim()})`
            });
            return;
          }
          
          try {
            // 解析Python腳本輸出的JSON
            const result = JSON.parse(outputData);
            
            if (result.success) {
              // 獲取相對路徑
              const relativePath = path.relative(
                path.join(__dirname, '..', 'public'),
                result.file_path
              ).replace(/\\/g, '/');
              
              resolve({
                success: true,
                data: {
                  downloadUrl: `/${relativePath}`,
                  estimatedTime: '已完成',
                  format: exportFormat,
                  rowCount: result.row_count,
                  columnCount: result.column_count
                }
              });
            } else {
              resolve({
                success: false,
                error: `導出廣告內容失敗: ${result.error}`
              });
            }
          } catch (error) {
            console.error('解析Python輸出失敗:', error);
            console.error('Python輸出:', outputData);
            
            resolve({
              success: false,
              error: `導出廣告內容失敗: 無法解析Python腳本輸出`
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `導出廣告內容失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  private determineContentType(creative: any): string {
    if (creative?.video_id) return 'video';
    if (creative?.object_story_spec?.link_data?.child_attachments) return 'carousel';
    return 'single_image';
  }

  private calculateQualityScore(insights: any): string {
    if (!insights) return '0';
    
    const ctr = insights.ctr || 0;
    const cpc = insights.cpc || 0;
    
    // 簡單的質量評分算法
    let score = 0;
    if (ctr > 2) score += 30;
    else if (ctr > 1) score += 20;
    else if (ctr > 0.5) score += 10;
    
    if (cpc < 0.5) score += 30;
    else if (cpc < 1) score += 20;
    else if (cpc < 2) score += 10;
    
    if (insights.frequency && insights.frequency < 3) score += 20;
    else if (insights.frequency && insights.frequency < 5) score += 10;
    
    return Math.min(score, 100).toString();
  }

  async getCampaigns(adAccountId?: string): Promise<FacebookAPIResponse> {
    try {
      if (!adAccountId) {
        const adAccountsResponse = await this.getAdAccounts();
        if (!adAccountsResponse.success || !adAccountsResponse.data?.accounts?.length) {
          return {
            success: false,
            error: '無法找到廣告帳戶'
          };
        }
        adAccountId = adAccountsResponse.data.accounts[0].id;
      }

      const response = await fetch(`${this.baseUrl}/act_${adAccountId}/campaigns?fields=id,name,status,objective,created_time,updated_time&access_token=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            campaigns: data.data || [],
            total: data.data?.length || 0
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || '獲取廣告活動失敗'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '網絡錯誤獲取廣告活動'
      };
    }
  }

  async getAdAccounts(): Promise<FacebookAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            accounts: data.data || [],
            total: data.data?.length || 0
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || '獲取廣告帳戶失敗'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '網絡錯誤獲取廣告帳戶'
      };
    }
  }

  async getAds(adAccountId?: string): Promise<FacebookAPIResponse> {
    try {
      if (!adAccountId) {
        const adAccountsResponse = await this.getAdAccounts();
        if (!adAccountsResponse.success || !adAccountsResponse.data?.accounts?.length) {
          return {
            success: false,
            error: '無法找到廣告帳戶'
          };
        }
        adAccountId = adAccountsResponse.data.accounts[0].id;
      }

      const response = await fetch(`${this.baseUrl}/act_${adAccountId}/ads?fields=id,name,status,created_time,updated_time,campaign{name}&access_token=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            ads: data.data || [],
            total: data.data?.length || 0
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || '獲取廣告失敗'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '網絡錯誤獲取廣告'
      };
    }
  }

  async getInsights(adAccountId?: string): Promise<FacebookAPIResponse> {
    try {
      if (!adAccountId) {
        const adAccountsResponse = await this.getAdAccounts();
        if (!adAccountsResponse.success || !adAccountsResponse.data?.accounts?.length) {
          return {
            success: false,
            error: '無法找到廣告帳戶'
          };
        }
        adAccountId = adAccountsResponse.data.accounts[0].id;
      }

      // Get insights for the last 6 months to include January data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const fromDate = sixMonthsAgo.toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];

      const response = await fetch(`${this.baseUrl}/act_${adAccountId}/insights?fields=impressions,clicks,spend,ctr,cpc,reach,frequency&time_range={'since':'${fromDate}','until':'${toDate}'}&access_token=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: {
            insights: data.data || [],
            total: data.data?.length || 0
          }
        };
      } else {
        return {
          success: false,
          error: data.error?.message || '獲取洞察數據失敗'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '網絡錯誤獲取洞察數據'
      };
    }
  }

  async getActivityLog(): Promise<FacebookAPIResponse> {
    try {
      // Try to get user activities first
      const response = await fetch(`${this.baseUrl}/me?fields=id,name&access_token=${this.apiKey}`);
      const userData = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: userData.error?.message || '無法獲取用戶信息'
        };
      }

      // Get ad account activities
      const adAccountsResponse = await this.getAdAccounts();
      if (!adAccountsResponse.success || !adAccountsResponse.data?.accounts?.length) {
        return {
          success: false,
          error: '無法找到廣告帳戶以獲取活動紀錄'
        };
      }

      const adAccountId = adAccountsResponse.data.accounts[0].id;
      
      // Get ad account activities
      const activitiesResponse = await fetch(`${this.baseUrl}/act_${adAccountId}/activities?fields=event_type,event_time,extra_data&limit=50&access_token=${this.apiKey}`);
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const activities = (activitiesData.data || []).map((activity: any, index: number) => ({
          id: `activity_${index}`,
          timestamp: activity.event_time,
          action: this.getActivityAction(activity.event_type),
          details: activity.extra_data ? JSON.stringify(activity.extra_data).substring(0, 100) + '...' : '廣告帳戶活動',
          status: 'completed'
        }));

        return {
          success: true,
          data: activities
        };
      } else {
        return {
          success: false,
          error: activitiesData.error?.message || '獲取活動紀錄失敗'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取活動紀錄失敗'
      };
    }
  }

  private getActivityAction(type: string): string {
    const actionMap: { [key: string]: string } = {
      'ad_account_create': '創建廣告帳戶',
      'campaign_create': '創建廣告活動',
      'campaign_update': '更新廣告活動',
      'ad_create': '創建廣告',
      'ad_update': '更新廣告',
      'payment': '付款',
      'unknown': '其他活動'
    };
    return actionMap[type] || '未知活動';
  }
}

export const facebookService = new FacebookService();
export type { FacebookAPIResponse, FacebookUser, FacebookPageInfo };