// 就業廣告內容分析服務
// 專注於婦女就業和中高齡就業招募廣告

interface EmploymentAdContent {
  id: string;
  title: string;
  content: string;
  jobType: '婦女就業' | '中高齡就業';
  industry: string;
  salary?: string;
  location: string;
  requirements: string[];
  benefits: string[];
  company: string;
  publishDate: Date;
  source: 'facebook' | 'manual' | 'scraped';
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    applications?: number;
  };
  adMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
  };
}

interface EmploymentAdAnalysis {
  totalAds: number;
  adsByType: Record<string, number>;
  topIndustries: Array<{ industry: string; count: number; avgSalary?: number }>;
  popularBenefits: Array<{ benefit: string; frequency: number }>;
  commonRequirements: Array<{ requirement: string; frequency: number }>;
  geographicDistribution: Record<string, number>;
  engagementTrends: {
    averageLikes: number;
    averageShares: number;
    averageComments: number;
    topPerformingAds: EmploymentAdContent[];
  };
  recommendedStrategies: string[];
}

class EmploymentAdAnalyzer {
  private adDatabase: EmploymentAdContent[] = [];

  constructor() {
    this.initializeWithSampleData();
  }

  private initializeWithSampleData() {
    // 初始化真實就業廣告樣本數據
    const sampleAds: EmploymentAdContent[] = [
      {
        id: 'emp_001',
        title: '誠徵行政助理 - 友善職場環境',
        content: '本公司提供彈性工作時間，歡迎二度就業婦女加入我們的團隊。工作內容包括文書處理、客戶服務等。',
        jobType: '婦女就業',
        industry: '行政服務',
        salary: '月薪 28,000 - 35,000',
        location: '台北市',
        requirements: ['高中職以上', '具備基本電腦操作', '溝通能力佳'],
        benefits: ['彈性工作時間', '完整教育訓練', '友善職場環境'],
        company: '北金國際有限公司',
        publishDate: new Date('2024-12-01'),
        source: 'facebook',
        engagement: {
          likes: 45,
          shares: 12,
          comments: 8,
          applications: 23
        },
        adMetrics: {
          spend: 1200,
          impressions: 8500,
          clicks: 178,
          ctr: 2.09,
          cpm: 14.12,
          cpc: 6.74
        }
      },
      {
        id: 'emp_002',
        title: '中高齡友善工作 - 清潔服務人員',
        content: '歡迎50歲以上有經驗人士應徵，提供完整訓練，工作穩定，時間彈性。',
        jobType: '中高齡就業',
        industry: '清潔服務',
        salary: '時薪 180 - 220',
        location: '新北市',
        requirements: ['不限學歷', '身體健康', '工作認真負責'],
        benefits: ['時間彈性', '完整訓練', '穩定工作'],
        company: '專業清潔服務公司',
        publishDate: new Date('2024-11-28'),
        source: 'facebook',
        engagement: {
          likes: 67,
          shares: 23,
          comments: 15,
          applications: 34
        },
        adMetrics: {
          spend: 890,
          impressions: 6200,
          clicks: 145,
          ctr: 2.34,
          cpm: 14.35,
          cpc: 6.14
        }
      },
      {
        id: 'emp_003',
        title: '門市服務人員 - 歡迎二度就業',
        content: '零售業門市服務，歡迎有育兒經驗的媽媽們加入，可配合孩子上學時間安排班表。',
        jobType: '婦女就業',
        industry: '零售業',
        salary: '月薪 26,000 - 32,000',
        location: '桃園市',
        requirements: ['高中職以上', '服務熱忱', '可配合排班'],
        benefits: ['彈性排班', '員工購物優惠', '在職訓練'],
        company: '連鎖零售企業',
        publishDate: new Date('2024-11-25'),
        source: 'facebook',
        engagement: {
          likes: 78,
          shares: 19,
          comments: 22,
          applications: 41
        },
        adMetrics: {
          spend: 1450,
          impressions: 9800,
          clicks: 205,
          ctr: 2.09,
          cpm: 14.80,
          cpc: 7.07
        }
      }
    ];

    this.adDatabase = sampleAds;
  }

  // 分析所有廣告內容
  analyzeEmploymentAds(): EmploymentAdAnalysis {
    const totalAds = this.adDatabase.length;
    
    // 按類型統計
    const adsByType = this.adDatabase.reduce((acc, ad) => {
      acc[ad.jobType] = (acc[ad.jobType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 熱門行業統計
    const industryStats = this.adDatabase.reduce((acc, ad) => {
      if (!acc[ad.industry]) {
        acc[ad.industry] = { count: 0, salaries: [] };
      }
      acc[ad.industry].count++;
      if (ad.salary) {
        // 簡單提取薪資數字進行平均計算
        const salaryMatch = ad.salary.match(/(\d+,?\d*)/g);
        if (salaryMatch) {
          const avgSalary = salaryMatch.map(s => parseInt(s.replace(',', ''))).reduce((a, b) => a + b, 0) / salaryMatch.length;
          acc[ad.industry].salaries.push(avgSalary);
        }
      }
      return acc;
    }, {} as Record<string, { count: number; salaries: number[] }>);

    const topIndustries = Object.entries(industryStats)
      .map(([industry, stats]) => ({
        industry,
        count: stats.count,
        avgSalary: stats.salaries.length > 0 ? Math.round(stats.salaries.reduce((a, b) => a + b, 0) / stats.salaries.length) : undefined
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 熱門福利統計
    const benefitCounts = this.adDatabase
      .flatMap(ad => ad.benefits)
      .reduce((acc, benefit) => {
        acc[benefit] = (acc[benefit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const popularBenefits = Object.entries(benefitCounts)
      .map(([benefit, frequency]) => ({ benefit, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // 常見要求統計
    const requirementCounts = this.adDatabase
      .flatMap(ad => ad.requirements)
      .reduce((acc, requirement) => {
        acc[requirement] = (acc[requirement] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const commonRequirements = Object.entries(requirementCounts)
      .map(([requirement, frequency]) => ({ requirement, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // 地理分佈
    const geographicDistribution = this.adDatabase.reduce((acc, ad) => {
      acc[ad.location] = (acc[ad.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 互動趨勢
    const totalLikes = this.adDatabase.reduce((sum, ad) => sum + ad.engagement.likes, 0);
    const totalShares = this.adDatabase.reduce((sum, ad) => sum + ad.engagement.shares, 0);
    const totalComments = this.adDatabase.reduce((sum, ad) => sum + ad.engagement.comments, 0);

    const topPerformingAds = this.adDatabase
      .sort((a, b) => {
        const scoreA = a.engagement.likes + a.engagement.shares * 2 + a.engagement.comments * 3;
        const scoreB = b.engagement.likes + b.engagement.shares * 2 + b.engagement.comments * 3;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // 推薦策略
    const recommendedStrategies = this.generateRecommendedStrategies(adsByType, topIndustries, popularBenefits);

    return {
      totalAds,
      adsByType,
      topIndustries,
      popularBenefits,
      commonRequirements,
      geographicDistribution,
      engagementTrends: {
        averageLikes: Math.round(totalLikes / totalAds),
        averageShares: Math.round(totalShares / totalAds),
        averageComments: Math.round(totalComments / totalAds),
        topPerformingAds
      },
      recommendedStrategies
    };
  }

  private generateRecommendedStrategies(
    adsByType: Record<string, number>, 
    topIndustries: Array<{ industry: string; count: number }>,
    popularBenefits: Array<{ benefit: string; frequency: number }>
  ): string[] {
    const strategies: string[] = [];

    // 基於廣告類型的策略
    const womenJobsCount = adsByType['婦女就業'] || 0;
    const seniorJobsCount = adsByType['中高齡就業'] || 0;

    if (womenJobsCount > seniorJobsCount) {
      strategies.push('加強中高齡就業廣告投放，平衡目標族群覆蓋');
    } else if (seniorJobsCount > womenJobsCount) {
      strategies.push('增加婦女就業相關廣告內容，擴大女性求職者觸及');
    }

    // 基於熱門行業的策略
    if (topIndustries.length > 0) {
      strategies.push(`重點關注${topIndustries[0].industry}領域，該行業需求量最高`);
    }

    // 基於熱門福利的策略
    if (popularBenefits.length > 0) {
      strategies.push(`強調"${popularBenefits[0].benefit}"等熱門福利，提高廣告吸引力`);
    }

    strategies.push('定期更新廣告內容，保持新鮮感和相關性');
    strategies.push('針對不同年齡層設計專屬廣告文案和視覺設計');

    return strategies;
  }

  // 獲取特定類型的廣告
  getAdsByType(jobType: '婦女就業' | '中高齡就業'): EmploymentAdContent[] {
    return this.adDatabase.filter(ad => ad.jobType === jobType);
  }

  // 添加新的廣告內容
  addEmploymentAd(ad: Omit<EmploymentAdContent, 'id'>): EmploymentAdContent {
    const newAd: EmploymentAdContent = {
      ...ad,
      id: `emp_${Date.now()}`
    };
    this.adDatabase.push(newAd);
    return newAd;
  }

  // 搜索廣告內容
  searchAds(query: string): EmploymentAdContent[] {
    const lowerQuery = query.toLowerCase();
    return this.adDatabase.filter(ad => 
      ad.title.toLowerCase().includes(lowerQuery) ||
      ad.content.toLowerCase().includes(lowerQuery) ||
      ad.industry.toLowerCase().includes(lowerQuery) ||
      ad.company.toLowerCase().includes(lowerQuery)
    );
  }

  // 獲取廣告效果統計
  getAdPerformanceStats(): any {
    if (this.adDatabase.length === 0) return null;

    const totalSpend = this.adDatabase.reduce((sum, ad) => sum + (ad.adMetrics?.spend || 0), 0);
    const totalImpressions = this.adDatabase.reduce((sum, ad) => sum + (ad.adMetrics?.impressions || 0), 0);
    const totalClicks = this.adDatabase.reduce((sum, ad) => sum + (ad.adMetrics?.clicks || 0), 0);
    const totalApplications = this.adDatabase.reduce((sum, ad) => sum + (ad.engagement.applications || 0), 0);

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions * 1000) : 0;

    return {
      totalSpend: totalSpend.toFixed(2),
      totalImpressions,
      totalClicks,
      totalApplications,
      ctr: avgCTR.toFixed(2),
      cpc: avgCPC.toFixed(2),
      cpm: avgCPM.toFixed(2)
    };
  }
}

export const employmentAdAnalyzer = new EmploymentAdAnalyzer();
export type { EmploymentAdContent, EmploymentAdAnalysis };