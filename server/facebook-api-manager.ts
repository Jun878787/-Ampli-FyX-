interface FacebookAPIConfig {
  id: string;
  name: string;
  apiKey: string;
  appId: string;
  appSecret?: string;
  accessToken?: string;
  adAccountId?: string;
  permissions: string[];
  isActive: boolean;
  description: string;
  lastUsed?: Date;
  rateLimitRemaining?: number;
  purpose: 'ads' | 'pages' | 'analytics' | 'general';
}

interface APIValidationResult {
  isValid: boolean;
  permissions: string[];
  rateLimitInfo: any;
  error?: string;
  adAccounts?: any[];
}

class FacebookAPIManager {
  private apiConfigs: Map<string, FacebookAPIConfig> = new Map();
  private activeConfigId: string = '';
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // 載入主要API配置
    const mainApiKey = process.env.FACEBOOK_API_KEY || '';
    
    if (mainApiKey) {
      const mainConfig: FacebookAPIConfig = {
        id: 'main',
        name: '主要Facebook API',
        apiKey: '2213169895810612|nj63XA8h7UYZkKbU_EPrkynNBQY',
        appId: '2213169895810612',
        appSecret: 'f83b0f49d07b550f65d69354659fc2dd',
        accessToken: '2213169895810612|nj63XA8h7UYZkKbU_EPrkynNBQY',
        adAccountId: process.env.FACEBOOK_AD_ACCOUNT_ID || '',
        permissions: ['ads_read', 'ads_management', 'business_management', 'pages_read_engagement'],
        isActive: true,
        description: '用於廣告管理和數據分析的主要API配置',
        lastUsed: new Date(),
        purpose: 'general'
      };
      
      this.apiConfigs.set('main', mainConfig);
      this.activeConfigId = 'main';
    }

    // 載入額外的API配置
    this.loadAdditionalConfigs();
  }

  private loadAdditionalConfigs() {
    // 支持多個API配置，格式：FACEBOOK_API_CONFIG_1, FACEBOOK_API_CONFIG_2, etc.
    let configIndex = 1;
    while (true) {
      const configKey = `FACEBOOK_API_CONFIG_${configIndex}`;
      const configData = process.env[configKey];
      
      if (!configData) break;
      
      try {
        const config = JSON.parse(configData) as Partial<FacebookAPIConfig>;
        if (config.id && config.apiKey) {
          const fullConfig: FacebookAPIConfig = {
            id: config.id,
            name: config.name || `Facebook API ${configIndex}`,
            apiKey: config.apiKey,
            appId: config.appId || '',
            appSecret: config.appSecret || '',
            accessToken: config.accessToken || config.apiKey,
            adAccountId: config.adAccountId || '',
            permissions: config.permissions || ['ads_read'],
            isActive: config.isActive !== false,
            description: config.description || `第${configIndex}個Facebook API配置`,
            lastUsed: config.lastUsed ? new Date(config.lastUsed) : undefined,
            purpose: config.purpose || 'general'
          };
          
          this.apiConfigs.set(config.id, fullConfig);
        }
      } catch (error) {
        console.warn(`Invalid Facebook API config at ${configKey}:`, error);
      }
      
      configIndex++;
    }
  }

  // 獲取所有API配置
  getApiConfigs(): FacebookAPIConfig[] {
    return Array.from(this.apiConfigs.values());
  }

  // 獲取特定用途的API配置
  getConfigsByPurpose(purpose: string): FacebookAPIConfig[] {
    return Array.from(this.apiConfigs.values()).filter(config => 
      config.purpose === purpose || config.purpose === 'general'
    );
  }

  // 設置活動的API配置
  setActiveConfig(configId: string): boolean {
    if (this.apiConfigs.has(configId)) {
      this.activeConfigId = configId;
      const config = this.apiConfigs.get(configId)!;
      config.lastUsed = new Date();
      return true;
    }
    return false;
  }

  // 獲取當前活動的API配置
  getActiveConfig(): FacebookAPIConfig | null {
    return this.apiConfigs.get(this.activeConfigId) || null;
  }

  // 獲取最佳配置（根據用途和可用性）
  getBestConfigForPurpose(purpose: string): FacebookAPIConfig | null {
    const configs = this.getConfigsByPurpose(purpose);
    
    // 優先選擇活躍且最近使用的配置
    const activeConfigs = configs.filter(c => c.isActive);
    if (activeConfigs.length === 0) return null;
    
    // 根據最後使用時間排序
    activeConfigs.sort((a, b) => {
      const aTime = a.lastUsed?.getTime() || 0;
      const bTime = b.lastUsed?.getTime() || 0;
      return bTime - aTime;
    });
    
    return activeConfigs[0];
  }

  // 添加新的API配置
  addApiConfig(config: Omit<FacebookAPIConfig, 'lastUsed'>): boolean {
    if (this.apiConfigs.has(config.id)) {
      return false; // 配置ID已存在
    }
    
    const fullConfig: FacebookAPIConfig = {
      ...config,
      lastUsed: new Date()
    };
    
    this.apiConfigs.set(config.id, fullConfig);
    
    // 如果是第一個配置，設為活動配置
    if (this.apiConfigs.size === 1) {
      this.activeConfigId = config.id;
    }
    
    return true;
  }

  // 更新API配置
  updateApiConfig(configId: string, updates: Partial<FacebookAPIConfig>): boolean {
    const config = this.apiConfigs.get(configId);
    if (!config) return false;
    
    Object.assign(config, updates);
    this.apiConfigs.set(configId, config);
    return true;
  }

  // 刪除API配置
  removeApiConfig(configId: string): boolean {
    if (configId === 'main') return false; // 不能刪除主配置
    
    const deleted = this.apiConfigs.delete(configId);
    
    // 如果刪除的是活動配置，切換到主配置
    if (deleted && this.activeConfigId === configId) {
      this.activeConfigId = 'main';
    }
    
    return deleted;
  }

  // 獲取當前使用的API密鑰
  getCurrentApiKey(purpose?: string): string {
    let config: FacebookAPIConfig | null;
    
    if (purpose) {
      config = this.getBestConfigForPurpose(purpose);
    } else {
      config = this.getActiveConfig();
    }
    
    return config?.accessToken || config?.apiKey || '';
  }

  // 檢查API配置狀態
  async checkConfigStatus(configId: string): Promise<APIValidationResult> {
    const config = this.apiConfigs.get(configId);
    if (!config) {
      return {
        isValid: false,
        permissions: [],
        rateLimitInfo: null,
        error: '配置不存在'
      };
    }

    try {
      // 檢查基本權限
      const meResponse = await fetch(`${this.baseUrl}/me?access_token=${config.accessToken}&fields=id,name`, {
        method: 'GET'
      });

      if (!meResponse.ok) {
        const errorData = await meResponse.json();
        return {
          isValid: false,
          permissions: [],
          rateLimitInfo: null,
          error: `API錯誤: ${errorData.error?.message || meResponse.status}`
        };
      }

      // 檢查廣告帳號權限
      let adAccounts = [];
      try {
        const adAccountsResponse = await fetch(`${this.baseUrl}/me/adaccounts?access_token=${config.accessToken}&fields=id,name,account_status,business`, {
          method: 'GET'
        });
        
        if (adAccountsResponse.ok) {
          const adAccountsData = await adAccountsResponse.json();
          adAccounts = adAccountsData.data || [];
        }
      } catch (error) {
        console.warn('無法獲取廣告帳號信息:', error);
      }

      // 檢查權限
      let permissions = [];
      try {
        const permissionsResponse = await fetch(`${this.baseUrl}/me/permissions?access_token=${config.accessToken}`, {
          method: 'GET'
        });
        
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          permissions = permissionsData.data?.map((p: any) => p.permission) || [];
        }
      } catch (error) {
        console.warn('無法獲取權限信息:', error);
      }

      return {
        isValid: true,
        permissions,
        rateLimitInfo: {
          businessUsage: meResponse.headers.get('x-business-use-case-usage'),
          appUsage: meResponse.headers.get('x-app-usage')
        },
        adAccounts
      };
    } catch (error) {
      return {
        isValid: false,
        permissions: [],
        rateLimitInfo: null,
        error: error instanceof Error ? error.message : '未知錯誤'
      };
    }
  }

  // 測試所有配置
  async validateAllConfigs(): Promise<Map<string, APIValidationResult>> {
    const results = new Map<string, APIValidationResult>();
    
    for (const [configId] of this.apiConfigs) {
      const result = await this.checkConfigStatus(configId);
      results.set(configId, result);
      
      // 更新配置狀態
      this.updateApiConfig(configId, {
        isActive: result.isValid,
        rateLimitRemaining: result.rateLimitInfo?.appUsage ? 
          JSON.parse(result.rateLimitInfo.appUsage).call_count : undefined
      });
    }
    
    return results;
  }

  // 獲取API配置使用建議
  getConfigurationGuidance(): {
    suggestions: string[];
    warnings: string[];
    requiredPermissions: string[];
  } {
    const configs = this.getApiConfigs();
    const suggestions: string[] = [];
    const warnings: string[] = [];
    
    if (configs.length === 0) {
      warnings.push('未配置任何Facebook API');
      suggestions.push('請添加至少一個有效的Facebook API配置');
    }
    
    const activeConfigs = configs.filter(c => c.isActive);
    if (activeConfigs.length === 0) {
      warnings.push('沒有活躍的API配置');
    }
    
    const adsConfigs = this.getConfigsByPurpose('ads');
    if (adsConfigs.length === 0) {
      suggestions.push('建議添加專門用於廣告管理的API配置');
    }
    
    if (configs.length === 1) {
      suggestions.push('建議添加備用API配置以提高可靠性');
    }
    
    const requiredPermissions = [
      'ads_read',
      'ads_management', 
      'business_management',
      'pages_read_engagement'
    ];
    
    return {
      suggestions,
      warnings,
      requiredPermissions
    };
  }
}

export const facebookAPIManager = new FacebookAPIManager();
export type { FacebookAPIConfig, APIValidationResult };