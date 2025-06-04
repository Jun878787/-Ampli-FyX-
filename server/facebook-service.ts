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
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.apiKey = process.env.FACEBOOK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Facebook API key not found in environment variables');
    }
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
        return {
          success: true,
          data: {
            valid: data.data.is_valid || false,
            app_id: data.data.app_id,
            expires_at: data.data.expires_at,
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
}

export const facebookService = new FacebookService();
export type { FacebookAPIResponse, FacebookUser, FacebookPageInfo };