import { facebookAPIManager, type FacebookAPIConfig } from './facebook-api-manager';
import { facebookService } from './facebook-service';

interface TokenRefreshResult {
  success: boolean;
  configId: string;
  newToken?: string;
  error?: string;
  expiresAt?: number; // Unix timestamp
}

interface TokenStatus {
  isValid: boolean;
  expiresAt?: number; // Unix timestamp
  expiresIn?: number; // Seconds
  scopes?: string[];
  error?: string;
}

class FacebookTokenManager {
  private refreshIntervalId: NodeJS.Timeout | null = null;
  private checkIntervalMinutes = 60; // 默认每60分钟检查一次令牌状态
  private notificationThresholdDays = 7; // 提前7天提醒令牌即将过期
  private autoRefreshEnabled = true; // 是否启用自动刷新
  private pendingRefresh: Set<string> = new Set(); // 正在刷新的令牌ID
  private tokenExpiryMap: Map<string, number> = new Map(); // 令牌ID -> 过期时间戳
  
  constructor() {
    // 初始化时加载所有令牌的过期时间
    this.loadTokenExpiryTimes();
  }

  /**
   * 启动定时检查令牌状态的任务
   */
  startTokenMonitoring(intervalMinutes?: number): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    
    if (intervalMinutes && intervalMinutes > 0) {
      this.checkIntervalMinutes = intervalMinutes;
    }
    
    console.log(`[FacebookTokenManager] 启动令牌监控，间隔: ${this.checkIntervalMinutes}分钟`);
    
    // 立即执行一次检查
    this.checkAllTokens();
    
    // 设置定时任务
    this.refreshIntervalId = setInterval(() => {
      this.checkAllTokens();
    }, this.checkIntervalMinutes * 60 * 1000);
  }

  /**
   * 停止令牌监控
   */
  stopTokenMonitoring(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
      console.log('[FacebookTokenManager] 令牌监控已停止');
    }
  }

  /**
   * 检查所有API配置的令牌状态
   */
  async checkAllTokens(): Promise<Map<string, TokenStatus>> {
    console.log('[FacebookTokenManager] 开始检查所有令牌状态...');
    const results = new Map<string, TokenStatus>();
    const configs = facebookAPIManager.getApiConfigs();
    
    for (const config of configs) {
      try {
        const status = await this.checkTokenStatus(config.id);
        results.set(config.id, status);
        
        // 更新令牌过期时间映射
        if (status.expiresAt) {
          this.tokenExpiryMap.set(config.id, status.expiresAt);
        }
        
        // 处理令牌状态
        this.handleTokenStatus(config.id, status);
      } catch (error) {
        console.error(`[FacebookTokenManager] 检查令牌 ${config.id} 状态时出错:`, error);
        results.set(config.id, { 
          isValid: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }
    
    return results;
  }

  /**
   * 检查单个令牌的状态
   */
  async checkTokenStatus(configId: string): Promise<TokenStatus> {
    const config = facebookAPIManager.getApiConfigs().find(c => c.id === configId);
    if (!config || !config.accessToken) {
      return { isValid: false, error: '配置不存在或无访问令牌' };
    }
    
    try {
      // 使用Facebook API调试令牌
      const response = await fetch(
        `https://graph.facebook.com/v18.0/debug_token?input_token=${config.accessToken}&access_token=${config.appId}|${config.appSecret}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (response.ok && data.data) {
        const tokenData = data.data;
        const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
        const expiresAt = tokenData.expires_at || 0;
        const expiresIn = expiresAt ? expiresAt - now : 0;
        
        return {
          isValid: tokenData.is_valid === true,
          expiresAt: expiresAt || undefined,
          expiresIn: expiresIn > 0 ? expiresIn : undefined,
          scopes: tokenData.scopes || []
        };
      } else {
        return {
          isValid: false,
          error: data.error?.message || '令牌验证失败'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }

  /**
   * 处理令牌状态，包括过期提醒和自动刷新
   */
  private async handleTokenStatus(configId: string, status: TokenStatus): Promise<void> {
    if (!status.isValid) {
      console.warn(`[FacebookTokenManager] 令牌 ${configId} 无效: ${status.error || '未知原因'}`);
      
      // 如果启用了自动刷新，尝试刷新无效的令牌
      if (this.autoRefreshEnabled && !this.pendingRefresh.has(configId)) {
        this.refreshToken(configId);
      }
      return;
    }
    
    // 检查令牌是否即将过期
    if (status.expiresIn !== undefined) {
      const expiresInDays = status.expiresIn / (24 * 60 * 60);
      
      if (expiresInDays <= this.notificationThresholdDays) {
        console.warn(`[FacebookTokenManager] 令牌 ${configId} 将在 ${expiresInDays.toFixed(1)} 天后过期`);
        
        // 如果启用了自动刷新且令牌即将过期（小于阈值的一半时间），尝试刷新
        if (this.autoRefreshEnabled && expiresInDays <= this.notificationThresholdDays / 2 && !this.pendingRefresh.has(configId)) {
          this.refreshToken(configId);
        }
      }
    }
  }

  /**
   * 刷新令牌
   * 注意：Facebook的短期令牌无法通过API自动刷新，需要用户交互
   * 这里实现的是长期令牌（Long-lived token）的获取
   */
  async refreshToken(configId: string): Promise<TokenRefreshResult> {
    if (this.pendingRefresh.has(configId)) {
      return { success: false, configId, error: '令牌刷新已在进行中' };
    }
    
    this.pendingRefresh.add(configId);
    
    try {
      const config = facebookAPIManager.getApiConfigs().find(c => c.id === configId);
      if (!config || !config.accessToken || !config.appId || !config.appSecret) {
        this.pendingRefresh.delete(configId);
        return { success: false, configId, error: '配置不存在或缺少必要参数' };
      }
      
      // 将短期令牌转换为长期令牌
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${config.appId}&client_secret=${config.appSecret}&fb_exchange_token=${config.accessToken}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        // 更新配置中的令牌
        const newToken = data.access_token;
        facebookAPIManager.updateApiConfig(configId, { accessToken: newToken });
        
        // 获取新令牌的过期时间
        const tokenStatus = await this.checkTokenStatus(configId);
        
        console.log(`[FacebookTokenManager] 成功刷新令牌 ${configId}，新令牌将在 ${tokenStatus.expiresIn ? (tokenStatus.expiresIn / (24 * 60 * 60)).toFixed(1) + ' 天' : '未知时间'} 后过期`);
        
        this.pendingRefresh.delete(configId);
        return { 
          success: true, 
          configId, 
          newToken, 
          expiresAt: tokenStatus.expiresAt 
        };
      } else {
        this.pendingRefresh.delete(configId);
        return { 
          success: false, 
          configId, 
          error: data.error?.message || '刷新令牌失败' 
        };
      }
    } catch (error) {
      this.pendingRefresh.delete(configId);
      return { 
        success: false, 
        configId, 
        error: error instanceof Error ? error.message : '刷新令牌时发生网络错误' 
      };
    }
  }

  /**
   * 获取长期令牌
   */
  async getLongLivedToken(shortLivedToken: string, appId: string, appSecret: string): Promise<{ success: boolean; token?: string; expiresIn?: number; error?: string }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        return { 
          success: true, 
          token: data.access_token, 
          expiresIn: data.expires_in 
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

  /**
   * 加载所有令牌的过期时间
   */
  private async loadTokenExpiryTimes(): Promise<void> {
    const configs = facebookAPIManager.getApiConfigs();
    
    for (const config of configs) {
      if (config.accessToken) {
        try {
          const status = await this.checkTokenStatus(config.id);
          if (status.expiresAt) {
            this.tokenExpiryMap.set(config.id, status.expiresAt);
          }
        } catch (error) {
          console.error(`[FacebookTokenManager] 加载令牌 ${config.id} 过期时间时出错:`, error);
        }
      }
    }
  }

  /**
   * 获取令牌过期时间
   */
  getTokenExpiryTime(configId: string): number | undefined {
    return this.tokenExpiryMap.get(configId);
  }

  /**
   * 设置自动刷新选项
   */
  setAutoRefreshEnabled(enabled: boolean): void {
    this.autoRefreshEnabled = enabled;
    console.log(`[FacebookTokenManager] 自动刷新已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 设置过期提醒阈值（天）
   */
  setNotificationThreshold(days: number): void {
    if (days > 0) {
      this.notificationThresholdDays = days;
      console.log(`[FacebookTokenManager] 令牌过期提醒阈值已设置为 ${days} 天`);
    }
  }
}

// 创建单例实例
export const facebookTokenManager = new FacebookTokenManager();