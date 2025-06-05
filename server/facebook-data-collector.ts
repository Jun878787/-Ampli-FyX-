import { facebookService } from './facebook-service';

interface FacebookSearchParams {
  keyword: string;
  type: 'pages' | 'users' | 'groups' | 'ads';
  location?: string;
  limit?: number;
}

interface CollectedData {
  id: string;
  name: string;
  category?: string;
  location?: string;
  followers_count?: number;
  likes?: number;
  link: string;
  profile_picture_url?: string;
  created_time?: string;
  description?: string;
}

class FacebookDataCollector {
  private apiKey: string;
  private appId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.appId = '2213169895810612';
    this.apiKey = '2213169895810612|nj63XA8h7UYZkKbU_EPrkynNBQY';
  }

  async searchPages(keyword: string, limit: number = 50): Promise<CollectedData[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&type=page&access_token=${this.apiKey}&limit=${limit}&fields=id,name,category,location,fan_count,link,picture,about,created_time`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data?.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        location: page.location?.city || page.location?.country || '未知',
        followers_count: page.fan_count || 0,
        link: `https://facebook.com/${page.id}`,
        profile_picture_url: page.picture?.data?.url,
        created_time: page.created_time,
        description: page.about
      })) || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async searchUsers(keyword: string, limit: number = 50): Promise<CollectedData[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&type=user&access_token=${this.apiKey}&limit=${limit}&fields=id,name,location,link,picture`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data?.map((user: any) => ({
        id: user.id,
        name: user.name,
        location: user.location?.name || '未知',
        link: `https://facebook.com/${user.id}`,
        profile_picture_url: user.picture?.data?.url
      })) || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async searchGroups(keyword: string, limit: number = 50): Promise<CollectedData[]> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(keyword)}&type=group&access_token=${this.apiKey}&limit=${limit}&fields=id,name,description,privacy,member_count,link`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data?.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        followers_count: group.member_count || 0,
        link: `https://facebook.com/groups/${group.id}`,
        category: group.privacy
      })) || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async getPagePosts(pageId: string, limit: number = 25): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/${pageId}/posts?access_token=${this.apiKey}&limit=${limit}&fields=id,message,created_time,link,full_picture,reactions.summary(true),comments.summary(true),shares`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async getAdInsights(adAccountId: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/act_${adAccountId}/insights?access_token=${this.apiKey}&fields=campaign_name,ad_name,impressions,clicks,spend,cpm,cpc,ctr,reach,frequency`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async getPagesByLocation(location: string, keyword: string, limit: number = 50): Promise<CollectedData[]> {
    try {
      // 使用位置和關鍵字組合搜索
      const searchQuery = `${keyword} ${location}`;
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}&type=page&access_token=${this.apiKey}&limit=${limit}&fields=id,name,category,location,fan_count,link,picture,about`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return [];
      }

      return data.data?.filter((page: any) => {
        const pageLocation = page.location?.city || page.location?.country || '';
        return pageLocation.toLowerCase().includes(location.toLowerCase());
      }).map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        location: page.location?.city || page.location?.country || '未知',
        followers_count: page.fan_count || 0,
        link: `https://facebook.com/${page.id}`,
        profile_picture_url: page.picture?.data?.url,
        description: page.about
      })) || [];
    } catch (error) {
      console.error('Network error:', error);
      return [];
    }
  }

  async testApiConnection(): Promise<{success: boolean, message: string, data?: any}> {
    try {
      const url = `${this.baseUrl}/debug_token?input_token=${this.apiKey}&access_token=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          message: `API錯誤: ${data.error.message}`
        };
      }

      return {
        success: true,
        message: 'Facebook API連接成功',
        data: data.data
      };
    } catch (error) {
      return {
        success: false,
        message: '網絡連接錯誤'
      };
    }
  }
}

export const facebookDataCollector = new FacebookDataCollector();