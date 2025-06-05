#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Facebook數據分析模塊

這個模塊提供Facebook數據的分析功能，包括：
- 廣告數據分析
- 用戶互動分析
- 趨勢分析
- 競爭對手分析
- 報告生成
"""

import os
import json
import time
import logging
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, List, Optional, Union, Any, Tuple
from configparser import ConfigParser
from datetime import datetime, timedelta

from utils import save_json, load_json

# 設置日誌
logger = logging.getLogger(__name__)


class FacebookDataAnalyzer:
    """Facebook數據分析類"""
    
    def __init__(self, config: ConfigParser):
        """初始化數據分析器
        
        Args:
            config: 配置對象
        """
        self.config = config
        
        # 數據存儲路徑
        self.data_dir = config.get('Files', 'data_dir', fallback='data')
        self.reports_dir = config.get('Files', 'reports_dir', fallback='reports')
        
        # 創建報告目錄
        os.makedirs(self.reports_dir, exist_ok=True)
        
        # 圖表樣式設置
        plt.style.use('ggplot')
        
        logger.info("Facebook數據分析器初始化完成")
    
    def load_data(self, file_path: str) -> Dict:
        """加載數據文件
        
        Args:
            file_path: 數據文件路徑
            
        Returns:
            加載的數據
        """
        try:
            data = load_json(file_path)
            logger.info(f"從 {file_path} 加載了數據")
            return data
        except Exception as e:
            logger.exception(f"加載數據時出錯: {e}")
            return {}
    
    def load_all_data(self, data_type: str) -> List[Dict]:
        """加載指定類型的所有數據
        
        Args:
            data_type: 數據類型 (page, group, ad_data)
            
        Returns:
            數據列表
        """
        type_dir = os.path.join(self.data_dir, data_type)
        if not os.path.exists(type_dir):
            logger.warning(f"數據目錄不存在: {type_dir}")
            return []
        
        all_data = []
        for filename in os.listdir(type_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(type_dir, filename)
                data = self.load_data(file_path)
                if data:
                    all_data.append({
                        "file": filename,
                        "data": data
                    })
        
        logger.info(f"加載了 {len(all_data)} 個 {data_type} 類型的數據文件")
        return all_data
    
    def analyze_ad_performance(self, ad_data: List[Dict]) -> Dict:
        """分析廣告表現
        
        Args:
            ad_data: 廣告數據列表
            
        Returns:
            分析結果
        """
        if not ad_data:
            return {"success": False, "error": "沒有廣告數據"}
        
        try:
            # 提取所有廣告系列數據
            campaigns = []
            for account_data in ad_data:
                if "campaigns" in account_data:
                    campaigns.extend(account_data["campaigns"])
            
            if not campaigns:
                return {"success": False, "error": "沒有廣告系列數據"}
            
            # 提取洞察數據
            insights_data = []
            for campaign in campaigns:
                if "insights" in campaign and "data" in campaign["insights"]:
                    for insight in campaign["insights"]["data"]:
                        insight["campaign_name"] = campaign.get("name", "未知")
                        insight["campaign_id"] = campaign.get("id", "未知")
                        insights_data.append(insight)
            
            if not insights_data:
                return {"success": False, "error": "沒有洞察數據"}
            
            # 轉換為DataFrame進行分析
            df = pd.DataFrame(insights_data)
            
            # 確保數值列是數值類型
            numeric_cols = ['impressions', 'clicks', 'spend', 'reach']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # 計算關鍵指標
            total_spend = df['spend'].sum() if 'spend' in df.columns else 0
            total_impressions = df['impressions'].sum() if 'impressions' in df.columns else 0
            total_clicks = df['clicks'].sum() if 'clicks' in df.columns else 0
            total_reach = df['reach'].sum() if 'reach' in df.columns else 0
            
            # 計算衍生指標
            ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
            cpc = (total_spend / total_clicks) if total_clicks > 0 else 0
            cpm = (total_spend / total_impressions * 1000) if total_impressions > 0 else 0
            frequency = (total_impressions / total_reach) if total_reach > 0 else 0
            
            # 按廣告系列分組
            campaign_performance = None
            if 'campaign_name' in df.columns and 'spend' in df.columns:
                campaign_performance = df.groupby('campaign_name').agg({
                    'spend': 'sum',
                    'impressions': 'sum',
                    'clicks': 'sum',
                    'reach': 'sum'
                }).reset_index()
                
                # 計算每個廣告系列的CTR和CPC
                campaign_performance['ctr'] = campaign_performance['clicks'] / campaign_performance['impressions'] * 100
                campaign_performance['cpc'] = campaign_performance['spend'] / campaign_performance['clicks']
                campaign_performance['cpm'] = campaign_performance['spend'] / campaign_performance['impressions'] * 1000
                
                # 處理無限值和NaN
                campaign_performance = campaign_performance.replace([np.inf, -np.inf], np.nan)
                campaign_performance = campaign_performance.fillna(0)
                
                # 轉換為字典列表
                campaign_performance = campaign_performance.to_dict('records')
            
            # 返回分析結果
            return {
                "success": True,
                "summary": {
                    "total_spend": total_spend,
                    "total_impressions": total_impressions,
                    "total_clicks": total_clicks,
                    "total_reach": total_reach,
                    "ctr": ctr,
                    "cpc": cpc,
                    "cpm": cpm,
                    "frequency": frequency
                },
                "campaign_performance": campaign_performance
            }
            
        except Exception as e:
            logger.exception(f"分析廣告表現時出錯: {e}")
            return {"success": False, "error": str(e)}
    
    def analyze_page_engagement(self, page_data: List[Dict]) -> Dict:
        """分析頁面互動
        
        Args:
            page_data: 頁面數據列表
            
        Returns:
            分析結果
        """
        if not page_data:
            return {"success": False, "error": "沒有頁面數據"}
        
        try:
            # 提取所有頁面和帖子數據
            pages = []
            posts = []
            
            for page_item in page_data:
                if isinstance(page_item, dict) and "data" in page_item:
                    for page in page_item["data"]:
                        pages.append(page)
                        if "posts" in page:
                            for post in page["posts"]:
                                post["page_id"] = page.get("id", "未知")
                                post["page_name"] = page.get("name", "未知")
                                posts.append(post)
                elif isinstance(page_item, list):
                    for page in page_item:
                        pages.append(page)
                        if "posts" in page:
                            for post in page["posts"]:
                                post["page_id"] = page.get("id", "未知")
                                post["page_name"] = page.get("name", "未知")
                                posts.append(post)
            
            if not pages:
                return {"success": False, "error": "沒有頁面數據"}
            
            # 頁面統計
            page_stats = {
                "total_pages": len(pages),
                "total_fans": sum(page.get("fan_count", 0) for page in pages),
                "avg_fans": sum(page.get("fan_count", 0) for page in pages) / len(pages) if pages else 0,
                "verified_pages": sum(1 for page in pages if page.get("verification_status") == "verified")
            }
            
            # 帖子分析
            post_stats = {}
            if posts:
                # 提取互動數據
                post_df = pd.DataFrame(posts)
                
                # 處理反應數據
                reactions_data = []
                for post in posts:
                    if "reactions" in post and "summary" in post["reactions"]:
                        reactions_data.append({
                            "post_id": post.get("id", "未知"),
                            "page_name": post.get("page_name", "未知"),
                            "created_time": post.get("created_time", ""),
                            "message": post.get("message", "")[:100] + "..." if len(post.get("message", "")) > 100 else post.get("message", ""),
                            "reactions": post["reactions"]["summary"].get("total_count", 0),
                            "comments": post["comments"]["summary"].get("total_count", 0) if "comments" in post and "summary" in post["comments"] else 0,
                            "shares": post.get("shares", {}).get("count", 0) if "shares" in post else 0
                        })
                
                if reactions_data:
                    reactions_df = pd.DataFrame(reactions_data)
                    
                    # 計算總互動
                    reactions_df["total_engagement"] = reactions_df["reactions"] + reactions_df["comments"] + reactions_df["shares"]
                    
                    # 按頁面分組
                    page_engagement = reactions_df.groupby("page_name").agg({
                        "reactions": "sum",
                        "comments": "sum",
                        "shares": "sum",
                        "total_engagement": "sum"
                    }).reset_index()
                    
                    # 找出互動最高的帖子
                    top_posts = reactions_df.sort_values("total_engagement", ascending=False).head(5).to_dict("records")
                    
                    post_stats = {
                        "total_posts": len(posts),
                        "total_reactions": reactions_df["reactions"].sum(),
                        "total_comments": reactions_df["comments"].sum(),
                        "total_shares": reactions_df["shares"].sum(),
                        "total_engagement": reactions_df["total_engagement"].sum(),
                        "avg_engagement_per_post": reactions_df["total_engagement"].mean(),
                        "page_engagement": page_engagement.to_dict("records"),
                        "top_posts": top_posts
                    }
            
            # 返回分析結果
            return {
                "success": True,
                "page_stats": page_stats,
                "post_stats": post_stats
            }
            
        except Exception as e:
            logger.exception(f"分析頁面互動時出錯: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_ad_performance_chart(self, ad_data: Dict, chart_type: str = "bar") -> str:
        """生成廣告表現圖表
        
        Args:
            ad_data: 廣告分析數據
            chart_type: 圖表類型 (bar, pie, line)
            
        Returns:
            保存的圖表文件路徑
        """
        if not ad_data.get("success", False):
            logger.error("無法生成圖表：數據分析失敗")
            return ""
        
        try:
            # 創建圖表目錄
            charts_dir = os.path.join(self.reports_dir, "charts")
            os.makedirs(charts_dir, exist_ok=True)
            
            # 生成文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = os.path.join(charts_dir, f"ad_performance_{chart_type}_{timestamp}.png")
            
            # 創建圖表
            plt.figure(figsize=(12, 8))
            
            if chart_type == "bar" and ad_data.get("campaign_performance"):
                # 廣告系列表現條形圖
                df = pd.DataFrame(ad_data["campaign_performance"])
                df = df.sort_values("spend", ascending=False).head(10)  # 取支出最高的10個廣告系列
                
                ax = df.plot(kind="bar", x="campaign_name", y="spend", color="skyblue")
                ax2 = ax.twinx()
                df.plot(kind="line", x="campaign_name", y="ctr", ax=ax2, color="red", marker="o")
                
                ax.set_xlabel("廣告系列")
                ax.set_ylabel("支出 ($)")
                ax2.set_ylabel("點擊率 (%)")
                plt.title("廣告系列支出和點擊率")
                plt.xticks(rotation=45, ha="right")
                plt.tight_layout()
                
            elif chart_type == "pie":
                # 支出分佈餅圖
                if ad_data.get("campaign_performance"):
                    df = pd.DataFrame(ad_data["campaign_performance"])
                    df = df.sort_values("spend", ascending=False).head(5)  # 取支出最高的5個廣告系列
                    
                    plt.pie(df["spend"], labels=df["campaign_name"], autopct="%1.1f%%", startangle=90)
                    plt.axis("equal")  # 保持圓形
                    plt.title("廣告支出分佈 (前5名廣告系列)")
                    
            elif chart_type == "line":
                # 假設我們有時間序列數據，這裡使用摘要數據創建簡單圖表
                summary = ad_data["summary"]
                metrics = ["ctr", "cpc", "cpm"]
                values = [summary["ctr"], summary["cpc"], summary["cpm"]]
                
                plt.bar(metrics, values, color=["blue", "green", "orange"])
                plt.xlabel("指標")
                plt.ylabel("值")
                plt.title("廣告表現關鍵指標")
            
            # 保存圖表
            plt.savefig(file_path)
            plt.close()
            
            logger.info(f"廣告表現圖表已保存到: {file_path}")
            return file_path
            
        except Exception as e:
            logger.exception(f"生成廣告表現圖表時出錯: {e}")
            return ""
    
    def generate_engagement_chart(self, engagement_data: Dict) -> str:
        """生成互動數據圖表
        
        Args:
            engagement_data: 互動分析數據
            
        Returns:
            保存的圖表文件路徑
        """
        if not engagement_data.get("success", False):
            logger.error("無法生成圖表：數據分析失敗")
            return ""
        
        try:
            # 創建圖表目錄
            charts_dir = os.path.join(self.reports_dir, "charts")
            os.makedirs(charts_dir, exist_ok=True)
            
            # 生成文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = os.path.join(charts_dir, f"engagement_{timestamp}.png")
            
            # 創建圖表
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7))
            
            # 頁面互動分佈
            if engagement_data.get("post_stats") and engagement_data["post_stats"].get("page_engagement"):
                df = pd.DataFrame(engagement_data["post_stats"]["page_engagement"])
                df = df.sort_values("total_engagement", ascending=False).head(5)  # 取互動最高的5個頁面
                
                df.plot(kind="bar", x="page_name", y=["reactions", "comments", "shares"], 
                        stacked=True, ax=ax1, colormap="viridis")
                ax1.set_xlabel("頁面")
                ax1.set_ylabel("互動數量")
                ax1.set_title("頁面互動分佈 (前5名)")
                ax1.legend(["反應", "評論", "分享"])
                plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha="right")
            
            # 互動類型分佈
            if engagement_data.get("post_stats"):
                post_stats = engagement_data["post_stats"]
                engagement_types = ["reactions", "comments", "shares"]
                engagement_values = [post_stats.get("total_reactions", 0), 
                                   post_stats.get("total_comments", 0), 
                                   post_stats.get("total_shares", 0)]
                
                ax2.pie(engagement_values, labels=engagement_types, autopct="%1.1f%%", startangle=90)
                ax2.axis("equal")  # 保持圓形
                ax2.set_title("互動類型分佈")
            
            plt.tight_layout()
            
            # 保存圖表
            plt.savefig(file_path)
            plt.close()
            
            logger.info(f"互動數據圖表已保存到: {file_path}")
            return file_path
            
        except Exception as e:
            logger.exception(f"生成互動數據圖表時出錯: {e}")
            return ""
    
    def generate_report(self, analysis_results: Dict, report_type: str = "html") -> str:
        """生成分析報告
        
        Args:
            analysis_results: 分析結果
            report_type: 報告類型 (html, json, txt)
            
        Returns:
            報告文件路徑
        """
        try:
            # 生成文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = f"report_{timestamp}.{report_type}"
            file_path = os.path.join(self.reports_dir, file_name)
            
            if report_type == "html":
                # 生成HTML報告
                html_content = self._generate_html_report(analysis_results)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(html_content)
                    
            elif report_type == "json":
                # 生成JSON報告
                save_json(file_path, analysis_results)
                
            elif report_type == "txt":
                # 生成文本報告
                txt_content = self._generate_text_report(analysis_results)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(txt_content)
            
            logger.info(f"分析報告已保存到: {file_path}")
            return file_path
            
        except Exception as e:
            logger.exception(f"生成報告時出錯: {e}")
            return ""
    
    def _generate_html_report(self, analysis_results: Dict) -> str:
        """生成HTML格式的報告
        
        Args:
            analysis_results: 分析結果
            
        Returns:
            HTML內容
        """
        html = ["<!DOCTYPE html>",
                "<html>",
                "<head>",
                "    <meta charset=\"utf-8\">",
                "    <title>Facebook數據分析報告</title>",
                "    <style>",
                "        body { font-family: Arial, sans-serif; margin: 20px; }",
                "        h1 { color: #3b5998; }",
                "        h2 { color: #4267B2; border-bottom: 1px solid #dddfe2; padding-bottom: 10px; }",
                "        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }",
                "        th, td { border: 1px solid #dddfe2; padding: 8px; text-align: left; }",
                "        th { background-color: #f5f6f7; }",
                "        .summary-box { background-color: #f5f6f7; border: 1px solid #dddfe2; padding: 15px; margin-bottom: 20px; border-radius: 5px; }",
                "        .metric { display: inline-block; width: 24%; margin-bottom: 10px; }",
                "        .metric-name { font-weight: bold; }",
                "        .chart-container { margin: 20px 0; text-align: center; }",
                "    </style>",
                "</head>",
                "<body>",
                "    <h1>Facebook數據分析報告</h1>",
                f"    <p>生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>"
               ]
        
        # 廣告表現部分
        if "ad_performance" in analysis_results and analysis_results["ad_performance"].get("success", False):
            ad_perf = analysis_results["ad_performance"]
            summary = ad_perf["summary"]
            
            html.extend([
                "    <h2>廣告表現分析</h2>",
                "    <div class=\"summary-box\">",
                "        <h3>摘要</h3>",
                "        <div class=\"metric\"><span class=\"metric-name\">總支出:</span> $" + f"{summary['total_spend']:.2f}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">總曝光數:</span> " + f"{int(summary['total_impressions']):,}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">總點擊數:</span> " + f"{int(summary['total_clicks']):,}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">總觸及人數:</span> " + f"{int(summary['total_reach']):,}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">點擊率 (CTR):</span> " + f"{summary['ctr']:.2f}%</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">每次點擊成本 (CPC):</span> $" + f"{summary['cpc']:.2f}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">千次曝光成本 (CPM):</span> $" + f"{summary['cpm']:.2f}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">頻率:</span> " + f"{summary['frequency']:.2f}</div>",
                "    </div>"
            ])
            
            # 廣告系列表現表格
            if "campaign_performance" in ad_perf and ad_perf["campaign_performance"]:
                html.extend([
                    "    <h3>廣告系列表現</h3>",
                    "    <table>",
                    "        <tr>",
                    "            <th>廣告系列</th>",
                    "            <th>支出</th>",
                    "            <th>曝光數</th>",
                    "            <th>點擊數</th>",
                    "            <th>點擊率</th>",
                    "            <th>每次點擊成本</th>",
                    "            <th>千次曝光成本</th>",
                    "        </tr>"
                ])
                
                for campaign in ad_perf["campaign_performance"]:
                    html.append(f"        <tr>")
                    html.append(f"            <td>{campaign['campaign_name']}</td>")
                    html.append(f"            <td>${campaign['spend']:.2f}</td>")
                    html.append(f"            <td>{int(campaign['impressions']):,}</td>")
                    html.append(f"            <td>{int(campaign['clicks']):,}</td>")
                    html.append(f"            <td>{campaign['ctr']:.2f}%</td>")
                    html.append(f"            <td>${campaign['cpc']:.2f}</td>")
                    html.append(f"            <td>${campaign['cpm']:.2f}</td>")
                    html.append(f"        </tr>")
                
                html.append("    </table>")
            
            # 圖表引用
            if "ad_chart_path" in analysis_results:
                chart_filename = os.path.basename(analysis_results["ad_chart_path"])
                html.extend([
                    "    <div class=\"chart-container\">",
                    f"        <img src=\"charts/{chart_filename}\" alt=\"廣告表現圖表\" style=\"max-width: 100%;\">",
                    "    </div>"
                ])
        
        # 頁面互動部分
        if "page_engagement" in analysis_results and analysis_results["page_engagement"].get("success", False):
            engagement = analysis_results["page_engagement"]
            page_stats = engagement["page_stats"]
            post_stats = engagement["post_stats"]
            
            html.extend([
                "    <h2>頁面互動分析</h2>",
                "    <div class=\"summary-box\">",
                "        <h3>頁面統計</h3>",
                "        <div class=\"metric\"><span class=\"metric-name\">總頁面數:</span> " + f"{page_stats['total_pages']}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">總粉絲數:</span> " + f"{page_stats['total_fans']:,}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">平均粉絲數:</span> " + f"{page_stats['avg_fans']:.0f}</div>",
                "        <div class=\"metric\"><span class=\"metric-name\">已驗證頁面數:</span> " + f"{page_stats['verified_pages']}</div>",
                "    </div>"
            ])
            
            if post_stats:
                html.extend([
                    "    <div class=\"summary-box\">",
                    "        <h3>帖子統計</h3>",
                    "        <div class=\"metric\"><span class=\"metric-name\">總帖子數:</span> " + f"{post_stats['total_posts']}</div>",
                    "        <div class=\"metric\"><span class=\"metric-name\">總反應數:</span> " + f"{post_stats['total_reactions']:,}</div>",
                    "        <div class=\"metric\"><span class=\"metric-name\">總評論數:</span> " + f"{post_stats['total_comments']:,}</div>",
                    "        <div class=\"metric\"><span class=\"metric-name\">總分享數:</span> " + f"{post_stats['total_shares']:,}</div>",
                    "        <div class=\"metric\"><span class=\"metric-name\">總互動數:</span> " + f"{post_stats['total_engagement']:,}</div>",
                    "        <div class=\"metric\"><span class=\"metric-name\">平均每帖互動數:</span> " + f"{post_stats['avg_engagement_per_post']:.1f}</div>",
                    "    </div>"
                ])
                
                # 頁面互動表格
                if "page_engagement" in post_stats and post_stats["page_engagement"]:
                    html.extend([
                        "    <h3>頁面互動詳情</h3>",
                        "    <table>",
                        "        <tr>",
                        "            <th>頁面</th>",
                        "            <th>反應數</th>",
                        "            <th>評論數</th>",
                        "            <th>分享數</th>",
                        "            <th>總互動數</th>",
                        "        </tr>"
                    ])
                    
                    for page in post_stats["page_engagement"]:
                        html.append(f"        <tr>")
                        html.append(f"            <td>{page['page_name']}</td>")
                        html.append(f"            <td>{int(page['reactions']):,}</td>")
                        html.append(f"            <td>{int(page['comments']):,}</td>")
                        html.append(f"            <td>{int(page['shares']):,}</td>")
                        html.append(f"            <td>{int(page['total_engagement']):,}</td>")
                        html.append(f"        </tr>")
                    
                    html.append("    </table>")
                
                # 互動最高的帖子
                if "top_posts" in post_stats and post_stats["top_posts"]:
                    html.extend([
                        "    <h3>互動最高的帖子</h3>",
                        "    <table>",
                        "        <tr>",
                        "            <th>頁面</th>",
                        "            <th>發布時間</th>",
                        "            <th>內容</th>",
                        "            <th>反應數</th>",
                        "            <th>評論數</th>",
                        "            <th>分享數</th>",
                        "            <th>總互動數</th>",
                        "        </tr>"
                    ])
                    
                    for post in post_stats["top_posts"]:
                        # 格式化日期
                        created_time = post.get("created_time", "")
                        if created_time:
                            try:
                                dt = datetime.strptime(created_time, "%Y-%m-%dT%H:%M:%S%z")
                                created_time = dt.strftime("%Y-%m-%d %H:%M")
                            except:
                                pass
                        
                        html.append(f"        <tr>")
                        html.append(f"            <td>{post['page_name']}</td>")
                        html.append(f"            <td>{created_time}</td>")
                        html.append(f"            <td>{post['message']}</td>")
                        html.append(f"            <td>{int(post['reactions']):,}</td>")
                        html.append(f"            <td>{int(post['comments']):,}</td>")
                        html.append(f"            <td>{int(post['shares']):,}</td>")
                        html.append(f"            <td>{int(post['total_engagement']):,}</td>")
                        html.append(f"        </tr>")
                    
                    html.append("    </table>")
            
            # 圖表引用
            if "engagement_chart_path" in analysis_results:
                chart_filename = os.path.basename(analysis_results["engagement_chart_path"])
                html.extend([
                    "    <div class=\"chart-container\">",
                    f"        <img src=\"charts/{chart_filename}\" alt=\"互動數據圖表\" style=\"max-width: 100%;\">",
                    "    </div>"
                ])
        
        # 結束HTML
        html.extend([
            "    <hr>",
            "    <p><em>此報告由Facebook數據分析器自動生成</em></p>",
            "</body>",
            "</html>"
        ])
        
        return "\n".join(html)
    
    def _generate_text_report(self, analysis_results: Dict) -> str:
        """生成文本格式的報告
        
        Args:
            analysis_results: 分析結果
            
        Returns:
            文本內容
        """
        lines = ["Facebook數據分析報告",
                 "=======================",
                 f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                 ""]
        
        # 廣告表現部分
        if "ad_performance" in analysis_results and analysis_results["ad_performance"].get("success", False):
            ad_perf = analysis_results["ad_performance"]
            summary = ad_perf["summary"]
            
            lines.extend([
                "廣告表現分析",
                "------------",
                "摘要:",
                f"  總支出: ${summary['total_spend']:.2f}",
                f"  總曝光數: {int(summary['total_impressions']):,}",
                f"  總點擊數: {int(summary['total_clicks']):,}",
                f"  總觸及人數: {int(summary['total_reach']):,}",
                f"  點擊率 (CTR): {summary['ctr']:.2f}%",
                f"  每次點擊成本 (CPC): ${summary['cpc']:.2f}",
                f"  千次曝光成本 (CPM): ${summary['cpm']:.2f}",
                f"  頻率: {summary['frequency']:.2f}",
                ""
            ])
            
            # 廣告系列表現
            if "campaign_performance" in ad_perf and ad_perf["campaign_performance"]:
                lines.append("廣告系列表現:")
                lines.append("-" * 80)
                lines.append(f"{'廣告系列':<30} {'支出':>10} {'曝光數':>10} {'點擊數':>10} {'點擊率':>10} {'CPC':>10} {'CPM':>10}")
                lines.append("-" * 80)
                
                for campaign in ad_perf["campaign_performance"]:
                    name = campaign['campaign_name'][:30]
                    lines.append(f"{name:<30} ${campaign['spend']:>9.2f} {int(campaign['impressions']):>10,} {int(campaign['clicks']):>10,} {campaign['ctr']:>9.2f}% ${campaign['cpc']:>9.2f} ${campaign['cpm']:>9.2f}")
                
                lines.append("")  # 空行
        
        # 頁面互動部分
        if "page_engagement" in analysis_results and analysis_results["page_engagement"].get("success", False):
            engagement = analysis_results["page_engagement"]
            page_stats = engagement["page_stats"]
            post_stats = engagement["post_stats"]
            
            lines.extend([
                "頁面互動分析",
                "------------",
                "頁面統計:",
                f"  總頁面數: {page_stats['total_pages']}",
                f"  總粉絲數: {page_stats['total_fans']:,}",
                f"  平均粉絲數: {page_stats['avg_fans']:.0f}",
                f"  已驗證頁面數: {page_stats['verified_pages']}",
                ""
            ])
            
            if post_stats:
                lines.extend([
                    "帖子統計:",
                    f"  總帖子數: {post_stats['total_posts']}",
                    f"  總反應數: {post_stats['total_reactions']:,}",
                    f"  總評論數: {post_stats['total_comments']:,}",
                    f"  總分享數: {post_stats['total_shares']:,}",
                    f"  總互動數: {post_stats['total_engagement']:,}",
                    f"  平均每帖互動數: {post_stats['avg_engagement_per_post']:.1f}",
                    ""
                ])
                
                # 頁面互動詳情
                if "page_engagement" in post_stats and post_stats["page_engagement"]:
                    lines.append("頁面互動詳情:")
                    lines.append("-" * 80)
                    lines.append(f"{'頁面':<30} {'反應數':>10} {'評論數':>10} {'分享數':>10} {'總互動數':>10}")
                    lines.append("-" * 80)
                    
                    for page in post_stats["page_engagement"]:
                        name = page['page_name'][:30]
                        lines.append(f"{name:<30} {int(page['reactions']):>10,} {int(page['comments']):>10,} {int(page['shares']):>10,} {int(page['total_engagement']):>10,}")
                    
                    lines.append("")  # 空行
                
                # 互動最高的帖子
                if "top_posts" in post_stats and post_stats["top_posts"]:
                    lines.append("互動最高的帖子:")
                    lines.append("-" * 80)
                    
                    for i, post in enumerate(post_stats["top_posts"], 1):
                        # 格式化日期
                        created_time = post.get("created_time", "")
                        if created_time:
                            try:
                                dt = datetime.strptime(created_time, "%Y-%m-%dT%H:%M:%S%z")
                                created_time = dt.strftime("%Y-%m-%d %H:%M")
                            except:
                                pass
                        
                        lines.extend([
                            f"[{i}] 頁面: {post['page_name']}",
                            f"    發布時間: {created_time}",
                            f"    內容: {post['message']}",
                            f"    反應數: {int(post['reactions']):,}",
                            f"    評論數: {int(post['comments']):,}",
                            f"    分享數: {int(post['shares']):,}",
                            f"    總互動數: {int(post['total_engagement']):,}",
                            ""
                        ])
        
        # 結束報告
        lines.extend([
            "-" * 80,
            "此報告由Facebook數據分析器自動生成"
        ])
        
        return "\n".join(lines)
    
    def run_analysis(self, analysis_type: str, data_source: str = None, 
                    generate_charts: bool = True, report_format: str = "html") -> Dict:
        """運行數據分析
        
        Args:
            analysis_type: 分析類型 (ad_performance, page_engagement, all)
            data_source: 數據源路徑（如果為None，則加載所有相關數據）
            generate_charts: 是否生成圖表
            report_format: 報告格式 (html, json, txt)
            
        Returns:
            分析結果和報告路徑
        """
        results = {}
        
        try:
            # 加載數據
            if data_source:
                data = self.load_data(data_source)
                if not data:
                    return {"success": False, "error": f"無法加載數據源: {data_source}"}
                
                # 根據文件名判斷數據類型
                if "ad" in os.path.basename(data_source).lower():
                    ad_data = [data]
                    page_data = []
                elif "page" in os.path.basename(data_source).lower():
                    ad_data = []
                    page_data = [data]
                else:
                    # 嘗試同時分析
                    ad_data = [data]
                    page_data = [data]
            else:
                # 加載所有相關數據
                if analysis_type in ["ad_performance", "all"]:
                    ad_data = self.load_all_data("ad_data")
                else:
                    ad_data = []
                
                if analysis_type in ["page_engagement", "all"]:
                    page_data = self.load_all_data("page")
                else:
                    page_data = []
            
            # 執行分析
            if analysis_type in ["ad_performance", "all"] and ad_data:
                ad_performance = self.analyze_ad_performance(ad_data)
                results["ad_performance"] = ad_performance
                
                # 生成圖表
                if generate_charts and ad_performance.get("success", False):
                    chart_path = self.generate_ad_performance_chart(ad_performance)
                    if chart_path:
                        results["ad_chart_path"] = chart_path
            
            if analysis_type in ["page_engagement", "all"] and page_data:
                page_engagement = self.analyze_page_engagement(page_data)
                results["page_engagement"] = page_engagement
                
                # 生成圖表
                if generate_charts and page_engagement.get("success", False):
                    chart_path = self.generate_engagement_chart(page_engagement)
                    if chart_path:
                        results["engagement_chart_path"] = chart_path
            
            # 生成報告
            if results:
                report_path = self.generate_report(results, report_format)
                results["report_path"] = report_path
                results["success"] = True
            else:
                results["success"] = False
                results["error"] = "沒有可分析的數據"
            
        except Exception as e:
            logger.exception(f"運行分析時出錯: {e}")
            results["success"] = False
            results["error"] = str(e)
        
        return results


if __name__ == "__main__":
    # 測試代碼
    import sys
    from utils import setup_logging, load_config
    
    setup_logging()
    config = load_config("config.ini")
    
    if not config:
        logger.error("無法加載配置文件")
        sys.exit(1)
    
    analyzer = FacebookDataAnalyzer(config)
    
    # 創建測試數據
    test_ad_data = [{
        "campaigns": [
            {
                "id": "123456789",
                "name": "測試廣告系列1",
                "insights": {
                    "data": [
                        {
                            "impressions": 10000,
                            "clicks": 500,
                            "spend": 100,
                            "reach": 5000
                        }
                    ]
                }
            },
            {
                "id": "987654321",
                "name": "測試廣告系列2",
                "insights": {
                    "data": [
                        {
                            "impressions": 20000,
                            "clicks": 800,
                            "spend": 150,
                            "reach": 8000
                        }
                    ]
                }
            }
        ]
    }]
    
    # 運行分析
    results = analyzer.analyze_ad_performance(test_ad_data)
    print(f"分析結果: {results['success']}")
    
    if results["success"]:
        # 生成圖表
        chart_path = analyzer.generate_ad_performance_chart(results)
        print(f"圖表已保存到: {chart_path}")
        
        # 生成報告
        report_path = analyzer.generate_report({"ad_performance": results, "ad_chart_path": chart_path})
        print(f"報告已保存到: {report_path}")