#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Facebook數據收集模塊

這個模塊提供Facebook數據的收集功能，包括：
- 頁面數據收集
- 群組數據收集
- 用戶數據收集
- 廣告數據收集
- 數據存儲與管理
"""

import os
import json
import time
import random
import logging
import requests
from typing import Dict, List, Optional, Union, Any
from configparser import ConfigParser
from datetime import datetime, timedelta

from utils import save_json, load_json

# 設置日誌
logger = logging.getLogger(__name__)


class FacebookDataCollector:
    """Facebook數據收集類"""
    
    def __init__(self, config: ConfigParser, account_manager=None):
        """初始化數據收集器
        
        Args:
            config: 配置對象
            account_manager: 賬戶管理器實例（可選）
        """
        self.config = config
        self.account_manager = account_manager
        
        # 從配置中讀取設置
        self.api_key = config.get('Facebook', 'api_key', fallback='')
        self.app_id = config.get('Facebook', 'app_id', fallback='')
        self.app_secret = config.get('Facebook', 'app_secret', fallback='')
        self.base_url = config.get('Facebook', 'base_url', fallback='https://graph.facebook.com/v18.0')
        
        # 數據存儲路徑
        self.data_dir = config.get('Files', 'data_dir', fallback='data')
        os.makedirs(self.data_dir, exist_ok=True)
        
        # 請求限制設置
        self.request_limit = config.getint('Limits', 'request_limit', fallback=100)
        self.request_interval = config.getfloat('Limits', 'request_interval', fallback=1.0)
        
        # 請求計數器
        self.request_count = 0
        self.last_request_time = 0
        
        logger.info("Facebook數據收集器初始化完成")
    
    def _make_request(self, endpoint: str, params: Dict = None, method: str = 'GET', 
                     account_id: str = None, retry: int = 3) -> Dict:
        """發送API請求
        
        Args:
            endpoint: API端點
            params: 請求參數
            method: 請求方法 (GET, POST等)
            account_id: 使用的賬戶ID（如果需要特定賬戶的訪問令牌）
            retry: 重試次數
            
        Returns:
            API響應數據
        """
        # 限制請求頻率
        current_time = time.time()
        if current_time - self.last_request_time < self.request_interval:
            sleep_time = self.request_interval - (current_time - self.last_request_time)
            time.sleep(sleep_time)
        
        # 更新請求計數和時間
        self.request_count += 1
        self.last_request_time = time.time()
        
        # 檢查是否超過請求限制
        if self.request_count >= self.request_limit:
            logger.warning(f"已達到請求限制 ({self.request_limit})，等待重置")
            time.sleep(60)  # 等待1分鐘後重置
            self.request_count = 0
        
        # 準備請求參數
        if params is None:
            params = {}
        
        # 如果沒有提供訪問令牌，使用應用訪問令牌
        if 'access_token' not in params:
            params['access_token'] = f"{self.app_id}|{self.app_secret}"
        
        # 如果提供了賬戶ID，嘗試使用該賬戶的訪問令牌
        if account_id and self.account_manager:
            account = self.account_manager.get_account(account_id)
            if account and 'access_token' in account:
                params['access_token'] = account['access_token']
        
        # 準備代理設置
        proxies = None
        if account_id and self.account_manager:
            account = self.account_manager.get_account(account_id)
            if account and account.get("use_proxy") and account.get("proxy_id"):
                proxy = next((p for p in self.account_manager.proxies if p["id"] == account["proxy_id"]), None)
                if proxy:
                    proxies = {
                        "http": f"http://{proxy['ip']}:{proxy['port']}",
                        "https": f"https://{proxy['ip']}:{proxy['port']}"
                    }
                    if proxy.get("username") and proxy.get("password"):
                        auth = f"{proxy['username']}:{proxy['password']}"
                        proxies = {
                            "http": f"http://{auth}@{proxy['ip']}:{proxy['port']}",
                            "https": f"https://{auth}@{proxy['ip']}:{proxy['port']}"
                        }
        
        # 發送請求
        url = f"{self.base_url}/{endpoint}"
        
        for attempt in range(retry):
            try:
                if method.upper() == 'GET':
                    response = requests.get(url, params=params, proxies=proxies, timeout=30)
                elif method.upper() == 'POST':
                    response = requests.post(url, data=params, proxies=proxies, timeout=30)
                else:
                    raise ValueError(f"不支持的請求方法: {method}")
                
                # 檢查響應
                if response.status_code == 200:
                    return response.json()
                else:
                    error = response.json().get("error", {})
                    logger.error(f"API請求失敗: {error.get('message', '未知錯誤')}")
                    
                    # 如果是速率限制錯誤，等待後重試
                    if error.get("code") == 4 or "rate limit" in error.get("message", "").lower():
                        wait_time = min(60 * (attempt + 1), 300)  # 最多等待5分鐘
                        logger.warning(f"達到速率限制，等待 {wait_time} 秒後重試")
                        time.sleep(wait_time)
                        continue
                    
                    return {"error": error, "success": False}
                    
            except Exception as e:
                logger.exception(f"請求異常: {e}")
                if attempt < retry - 1:
                    wait_time = 5 * (attempt + 1)
                    logger.info(f"等待 {wait_time} 秒後重試")
                    time.sleep(wait_time)
                else:
                    return {"error": str(e), "success": False}
        
        return {"error": "所有重試都失敗了", "success": False}
    
    def search_pages(self, query: str, limit: int = 10, fields: str = None) -> List[Dict]:
        """搜索Facebook頁面
        
        Args:
            query: 搜索關鍵詞
            limit: 返回結果數量限制
            fields: 要獲取的字段，逗號分隔
            
        Returns:
            頁面列表
        """
        if not fields:
            fields = "id,name,category,link,fan_count,verification_status,about,description,website"
        
        params = {
            "q": query,
            "type": "page",
            "limit": limit,
            "fields": fields
        }
        
        result = self._make_request("search", params)
        
        if "data" in result:
            pages = result["data"]
            logger.info(f"搜索到 {len(pages)} 個頁面，關鍵詞: '{query}'")
            return pages
        else:
            logger.warning(f"搜索頁面失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def get_page_details(self, page_id: str, fields: str = None) -> Dict:
        """獲取頁面詳細信息
        
        Args:
            page_id: 頁面ID
            fields: 要獲取的字段，逗號分隔
            
        Returns:
            頁面詳細信息
        """
        if not fields:
            fields = "id,name,category,link,fan_count,verification_status,about,description,website,location,phone,emails,founded,company_overview,mission,products,hours"
        
        params = {"fields": fields}
        
        result = self._make_request(page_id, params)
        
        if "id" in result:
            logger.info(f"獲取頁面詳情成功: {result.get('name', page_id)}")
            return result
        else:
            logger.warning(f"獲取頁面詳情失敗: {result.get('error', '未知錯誤')}")
            return {}
    
    def get_page_posts(self, page_id: str, limit: int = 25, since: str = None) -> List[Dict]:
        """獲取頁面發布的帖子
        
        Args:
            page_id: 頁面ID
            limit: 返回結果數量限制
            since: 開始日期 (ISO格式: YYYY-MM-DD)
            
        Returns:
            帖子列表
        """
        params = {
            "limit": limit,
            "fields": "id,message,created_time,type,permalink_url,shares,reactions.summary(true),comments.summary(true)"
        }
        
        if since:
            params["since"] = since
        
        result = self._make_request(f"{page_id}/posts", params)
        
        if "data" in result:
            posts = result["data"]
            logger.info(f"獲取到 {len(posts)} 個帖子，頁面ID: {page_id}")
            
            # 處理分頁
            while "paging" in result and "next" in result["paging"] and len(posts) < limit:
                next_url = result["paging"]["next"]
                next_url = next_url.replace(self.base_url, "").split("?")[0]
                params = {k: v for k, v in [p.split("=") for p in next_url.split("?")[1].split("&")]}
                
                result = self._make_request(next_url, params)
                if "data" in result:
                    posts.extend(result["data"])
                    logger.info(f"獲取到額外 {len(result['data'])} 個帖子")
                else:
                    break
            
            return posts[:limit]
        else:
            logger.warning(f"獲取頁面帖子失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def search_groups(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索Facebook群組
        
        Args:
            query: 搜索關鍵詞
            limit: 返回結果數量限制
            
        Returns:
            群組列表
        """
        params = {
            "q": query,
            "type": "group",
            "limit": limit,
            "fields": "id,name,description,privacy,member_count,owner"
        }
        
        result = self._make_request("search", params)
        
        if "data" in result:
            groups = result["data"]
            logger.info(f"搜索到 {len(groups)} 個群組，關鍵詞: '{query}'")
            return groups
        else:
            logger.warning(f"搜索群組失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def get_group_details(self, group_id: str, account_id: str = None) -> Dict:
        """獲取群組詳細信息
        
        Args:
            group_id: 群組ID
            account_id: 使用的賬戶ID（需要是群組成員）
            
        Returns:
            群組詳細信息
        """
        params = {
            "fields": "id,name,description,privacy,member_count,owner,cover,updated_time"
        }
        
        result = self._make_request(group_id, params, account_id=account_id)
        
        if "id" in result:
            logger.info(f"獲取群組詳情成功: {result.get('name', group_id)}")
            return result
        else:
            logger.warning(f"獲取群組詳情失敗: {result.get('error', '未知錯誤')}")
            return {}
    
    def get_group_posts(self, group_id: str, limit: int = 25, account_id: str = None) -> List[Dict]:
        """獲取群組帖子
        
        Args:
            group_id: 群組ID
            limit: 返回結果數量限制
            account_id: 使用的賬戶ID（需要是群組成員）
            
        Returns:
            帖子列表
        """
        params = {
            "limit": limit,
            "fields": "id,message,created_time,type,permalink_url,from,reactions.summary(true),comments.summary(true)"
        }
        
        result = self._make_request(f"{group_id}/feed", params, account_id=account_id)
        
        if "data" in result:
            posts = result["data"]
            logger.info(f"獲取到 {len(posts)} 個群組帖子，群組ID: {group_id}")
            return posts
        else:
            logger.warning(f"獲取群組帖子失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def search_users(self, query: str, limit: int = 10) -> List[Dict]:
        """搜索Facebook用戶
        
        Args:
            query: 搜索關鍵詞
            limit: 返回結果數量限制
            
        Returns:
            用戶列表
        """
        params = {
            "q": query,
            "type": "user",
            "limit": limit,
            "fields": "id,name,link,picture"
        }
        
        result = self._make_request("search", params)
        
        if "data" in result:
            users = result["data"]
            logger.info(f"搜索到 {len(users)} 個用戶，關鍵詞: '{query}'")
            return users
        else:
            logger.warning(f"搜索用戶失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def get_user_details(self, user_id: str, account_id: str = None) -> Dict:
        """獲取用戶詳細信息
        
        Args:
            user_id: 用戶ID
            account_id: 使用的賬戶ID（可能需要是好友關係）
            
        Returns:
            用戶詳細信息
        """
        params = {
            "fields": "id,name,first_name,last_name,link,picture,gender,locale,timezone,verified"
        }
        
        result = self._make_request(user_id, params, account_id=account_id)
        
        if "id" in result:
            logger.info(f"獲取用戶詳情成功: {result.get('name', user_id)}")
            return result
        else:
            logger.warning(f"獲取用戶詳情失敗: {result.get('error', '未知錯誤')}")
            return {}
    
    def get_ad_accounts(self, account_id: str) -> List[Dict]:
        """獲取廣告賬戶列表
        
        Args:
            account_id: 使用的賬戶ID
            
        Returns:
            廣告賬戶列表
        """
        if not self.account_manager:
            logger.error("需要賬戶管理器來獲取廣告賬戶")
            return []
        
        account = self.account_manager.get_account(account_id)
        if not account or 'access_token' not in account:
            logger.error(f"賬戶 {account_id} 不存在或沒有訪問令牌")
            return []
        
        params = {
            "access_token": account['access_token'],
            "fields": "id,name,account_id,account_status,business_name,currency,timezone_name"
        }
        
        result = self._make_request("me/adaccounts", params, account_id=account_id)
        
        if "data" in result:
            ad_accounts = result["data"]
            logger.info(f"獲取到 {len(ad_accounts)} 個廣告賬戶")
            return ad_accounts
        else:
            logger.warning(f"獲取廣告賬戶失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def get_ad_campaigns(self, ad_account_id: str, account_id: str, 
                        date_preset: str = "last_30days") -> List[Dict]:
        """獲取廣告系列
        
        Args:
            ad_account_id: 廣告賬戶ID
            account_id: 使用的賬戶ID
            date_preset: 日期範圍預設值
            
        Returns:
            廣告系列列表
        """
        if not ad_account_id.startswith('act_'):
            ad_account_id = f"act_{ad_account_id}"
        
        params = {
            "fields": "id,name,objective,status,created_time,start_time,stop_time,daily_budget,lifetime_budget,insights.date_preset({}){{\
                impressions,clicks,cpc,cpm,ctr,spend,reach\
            }}".format(date_preset)
        }
        
        result = self._make_request(f"{ad_account_id}/campaigns", params, account_id=account_id)
        
        if "data" in result:
            campaigns = result["data"]
            logger.info(f"獲取到 {len(campaigns)} 個廣告系列，廣告賬戶: {ad_account_id}")
            return campaigns
        else:
            logger.warning(f"獲取廣告系列失敗: {result.get('error', '未知錯誤')}")
            return []
    
    def get_ad_insights(self, ad_account_id: str, account_id: str, 
                       date_preset: str = "last_30days", level: str = "account") -> Dict:
        """獲取廣告洞察數據
        
        Args:
            ad_account_id: 廣告賬戶ID
            account_id: 使用的賬戶ID
            date_preset: 日期範圍預設值
            level: 數據級別 (account, campaign, adset, ad)
            
        Returns:
            廣告洞察數據
        """
        if not ad_account_id.startswith('act_'):
            ad_account_id = f"act_{ad_account_id}"
        
        params = {
            "level": level,
            "date_preset": date_preset,
            "fields": "account_id,account_name,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,\
                      impressions,clicks,cpc,cpm,ctr,spend,reach,frequency,actions,conversions,cost_per_action_type"
        }
        
        result = self._make_request(f"{ad_account_id}/insights", params, account_id=account_id)
        
        if "data" in result:
            insights = result["data"]
            logger.info(f"獲取到廣告洞察數據，廣告賬戶: {ad_account_id}, 級別: {level}")
            return {"success": True, "data": insights}
        else:
            logger.warning(f"獲取廣告洞察數據失敗: {result.get('error', '未知錯誤')}")
            return {"success": False, "error": result.get('error', '未知錯誤')}
    
    def save_collected_data(self, data_type: str, data: Union[Dict, List], 
                          identifier: str = None) -> str:
        """保存收集的數據
        
        Args:
            data_type: 數據類型 (page, group, user, ad_account, ad_campaign, ad_insight)
            data: 要保存的數據
            identifier: 數據標識符（可選）
            
        Returns:
            保存的文件路徑
        """
        # 創建數據類型目錄
        type_dir = os.path.join(self.data_dir, data_type)
        os.makedirs(type_dir, exist_ok=True)
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if identifier:
            filename = f"{data_type}_{identifier}_{timestamp}.json"
        else:
            filename = f"{data_type}_{timestamp}.json"
        
        file_path = os.path.join(type_dir, filename)
        
        # 保存數據
        save_json(file_path, data)
        logger.info(f"數據已保存到: {file_path}")
        
        return file_path
    
    def collect_page_data(self, query: str = None, page_id: str = None, 
                        include_posts: bool = True, save: bool = True) -> Dict:
        """收集頁面數據
        
        Args:
            query: 搜索關鍵詞（與page_id二選一）
            page_id: 頁面ID（與query二選一）
            include_posts: 是否包含帖子
            save: 是否保存數據
            
        Returns:
            收集的數據
        """
        result = {"success": False, "data": None, "file_path": None}
        
        try:
            if page_id:
                # 直接獲取頁面詳情
                page = self.get_page_details(page_id)
                if not page:
                    return {"success": False, "error": "無法獲取頁面詳情"}
                
                pages = [page]
            elif query:
                # 搜索頁面
                pages = self.search_pages(query)
                if not pages:
                    return {"success": False, "error": "未找到匹配的頁面"}
            else:
                return {"success": False, "error": "必須提供query或page_id參數"}
            
            # 收集頁面詳情
            collected_data = []
            for page in pages:
                page_data = self.get_page_details(page["id"]) if page_id is None else page
                
                # 收集帖子
                if include_posts:
                    posts = self.get_page_posts(page["id"])
                    page_data["posts"] = posts
                
                collected_data.append(page_data)
            
            # 保存數據
            if save:
                identifier = page_id if page_id else query.replace(" ", "_")[:30]
                file_path = self.save_collected_data("page", collected_data, identifier)
                result["file_path"] = file_path
            
            result["success"] = True
            result["data"] = collected_data
            
        except Exception as e:
            logger.exception(f"收集頁面數據時出錯: {e}")
            result["error"] = str(e)
        
        return result
    
    def collect_group_data(self, query: str = None, group_id: str = None, 
                         include_posts: bool = True, account_id: str = None, 
                         save: bool = True) -> Dict:
        """收集群組數據
        
        Args:
            query: 搜索關鍵詞（與group_id二選一）
            group_id: 群組ID（與query二選一）
            include_posts: 是否包含帖子
            account_id: 使用的賬戶ID（需要是群組成員）
            save: 是否保存數據
            
        Returns:
            收集的數據
        """
        result = {"success": False, "data": None, "file_path": None}
        
        try:
            if group_id:
                # 直接獲取群組詳情
                group = self.get_group_details(group_id, account_id)
                if not group:
                    return {"success": False, "error": "無法獲取群組詳情"}
                
                groups = [group]
            elif query:
                # 搜索群組
                groups = self.search_groups(query)
                if not groups:
                    return {"success": False, "error": "未找到匹配的群組"}
            else:
                return {"success": False, "error": "必須提供query或group_id參數"}
            
            # 收集群組詳情
            collected_data = []
            for group in groups:
                group_data = self.get_group_details(group["id"], account_id) if group_id is None else group
                
                # 收集帖子
                if include_posts:
                    posts = self.get_group_posts(group["id"], account_id=account_id)
                    group_data["posts"] = posts
                
                collected_data.append(group_data)
            
            # 保存數據
            if save:
                identifier = group_id if group_id else query.replace(" ", "_")[:30]
                file_path = self.save_collected_data("group", collected_data, identifier)
                result["file_path"] = file_path
            
            result["success"] = True
            result["data"] = collected_data
            
        except Exception as e:
            logger.exception(f"收集群組數據時出錯: {e}")
            result["error"] = str(e)
        
        return result
    
    def collect_ad_data(self, account_id: str, ad_account_id: str = None, 
                      include_campaigns: bool = True, include_insights: bool = True, 
                      save: bool = True) -> Dict:
        """收集廣告數據
        
        Args:
            account_id: 使用的賬戶ID
            ad_account_id: 廣告賬戶ID（如果不提供，將獲取所有廣告賬戶）
            include_campaigns: 是否包含廣告系列
            include_insights: 是否包含廣告洞察數據
            save: 是否保存數據
            
        Returns:
            收集的數據
        """
        result = {"success": False, "data": None, "file_path": None}
        
        try:
            # 獲取廣告賬戶
            if ad_account_id:
                ad_accounts = [{
                    "id": ad_account_id if ad_account_id.startswith('act_') else f"act_{ad_account_id}",
                    "account_id": ad_account_id.replace('act_', '')
                }]
            else:
                ad_accounts = self.get_ad_accounts(account_id)
                if not ad_accounts:
                    return {"success": False, "error": "未找到廣告賬戶"}
            
            # 收集廣告數據
            collected_data = []
            for ad_account in ad_accounts:
                account_data = {"account": ad_account}
                
                # 收集廣告系列
                if include_campaigns:
                    campaigns = self.get_ad_campaigns(ad_account["id"], account_id)
                    account_data["campaigns"] = campaigns
                
                # 收集廣告洞察數據
                if include_insights:
                    insights = self.get_ad_insights(ad_account["id"], account_id)
                    if insights["success"]:
                        account_data["insights"] = insights["data"]
                
                collected_data.append(account_data)
            
            # 保存數據
            if save:
                identifier = ad_account_id if ad_account_id else f"acc_{account_id}"
                file_path = self.save_collected_data("ad_data", collected_data, identifier)
                result["file_path"] = file_path
            
            result["success"] = True
            result["data"] = collected_data
            
        except Exception as e:
            logger.exception(f"收集廣告數據時出錯: {e}")
            result["error"] = str(e)
        
        return result
    
    def run_collection_task(self, task_config: Dict) -> Dict:
        """運行數據收集任務
        
        Args:
            task_config: 任務配置
            
        Returns:
            任務結果
        """
        task_type = task_config.get("type")
        logger.info(f"開始執行 {task_type} 類型的數據收集任務")
        
        if task_type == "page":
            return self.collect_page_data(
                query=task_config.get("query"),
                page_id=task_config.get("page_id"),
                include_posts=task_config.get("include_posts", True)
            )
        elif task_type == "group":
            return self.collect_group_data(
                query=task_config.get("query"),
                group_id=task_config.get("group_id"),
                include_posts=task_config.get("include_posts", True),
                account_id=task_config.get("account_id")
            )
        elif task_type == "ad_data":
            return self.collect_ad_data(
                account_id=task_config.get("account_id"),
                ad_account_id=task_config.get("ad_account_id"),
                include_campaigns=task_config.get("include_campaigns", True),
                include_insights=task_config.get("include_insights", True)
            )
        else:
            logger.error(f"不支持的任務類型: {task_type}")
            return {"success": False, "error": f"不支持的任務類型: {task_type}"}


if __name__ == "__main__":
    # 測試代碼
    import sys
    from utils import setup_logging, load_config
    
    setup_logging()
    config = load_config("config.ini")
    
    if not config:
        logger.error("無法加載配置文件")
        sys.exit(1)
    
    collector = FacebookDataCollector(config)
    
    # 測試搜索頁面
    pages = collector.search_pages("technology news")
    print(f"找到 {len(pages)} 個頁面")
    
    if pages:
        # 測試獲取頁面詳情
        page_details = collector.get_page_details(pages[0]["id"])
        print(f"頁面詳情: {page_details.get('name')}")
        
        # 測試獲取頁面帖子
        posts = collector.get_page_posts(pages[0]["id"], limit=5)
        print(f"獲取到 {len(posts)} 個帖子")