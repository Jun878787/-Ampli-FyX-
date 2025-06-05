#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Facebook賬戶管理模塊

這個模塊提供Facebook賬戶的管理功能，包括：
- 賬戶創建與註冊
- 賬戶登錄與驗證
- 賬戶狀態監控
- 批量賬戶管理
- 代理設置與管理
"""

import os
import json
import time
import random
import logging
import requests
from typing import Dict, List, Optional, Union, Any
from configparser import ConfigParser

from utils import save_json, load_json

# 設置日誌
logger = logging.getLogger(__name__)


class FacebookAccountManager:
    """Facebook賬戶管理類"""
    
    def __init__(self, config: ConfigParser):
        """初始化賬戶管理器
        
        Args:
            config: 配置對象
        """
        self.config = config
        self.accounts_file = config.get('Files', 'accounts_file', fallback='accounts.json')
        self.proxies_file = config.get('Files', 'proxies_file', fallback='proxies.json')
        self.api_key = config.get('Facebook', 'api_key', fallback='')
        self.app_id = config.get('Facebook', 'app_id', fallback='')
        self.app_secret = config.get('Facebook', 'app_secret', fallback='')
        self.base_url = config.get('Facebook', 'base_url', fallback='https://graph.facebook.com/v18.0')
        
        # 加載賬戶和代理
        self.accounts = self._load_accounts()
        self.proxies = self._load_proxies()
        
        logger.info(f"已加載 {len(self.accounts)} 個賬戶和 {len(self.proxies)} 個代理")
    
    def _load_accounts(self) -> List[Dict[str, Any]]:
        """加載賬戶數據"""
        return load_json(self.accounts_file, default=[])
    
    def _save_accounts(self) -> bool:
        """保存賬戶數據"""
        return save_json(self.accounts_file, self.accounts)
    
    def _load_proxies(self) -> List[Dict[str, str]]:
        """加載代理數據"""
        return load_json(self.proxies_file, default=[])
    
    def create_account(self, username: str, email: str, password: str, 
                      use_proxy: bool = False, **kwargs) -> Dict[str, Any]:
        """創建新的Facebook賬戶
        
        Args:
            username: 用戶名
            email: 電子郵件
            password: 密碼
            use_proxy: 是否使用代理
            **kwargs: 其他賬戶屬性
            
        Returns:
            新創建的賬戶信息
        """
        # 生成賬戶ID
        account_id = f"acc_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # 創建賬戶對象
        account = {
            "id": account_id,
            "username": username,
            "email": email,
            "password": password,  # 注意：實際應用中應加密存儲
            "status": "pending",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "last_login": None,
            "use_proxy": use_proxy,
            "proxy_id": None,
        }
        
        # 添加其他屬性
        account.update(kwargs)
        
        # 如果需要使用代理，分配一個代理
        if use_proxy and self.proxies:
            proxy = random.choice(self.proxies)
            account["proxy_id"] = proxy["id"]
            logger.info(f"為賬戶 {account_id} 分配代理: {proxy['ip']}:{proxy['port']}")
        
        # 添加到賬戶列表
        self.accounts.append(account)
        self._save_accounts()
        
        logger.info(f"創建新賬戶: {username} ({email})")
        return account
    
    def get_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        """獲取賬戶信息
        
        Args:
            account_id: 賬戶ID
            
        Returns:
            賬戶信息，如果不存在則返回None
        """
        for account in self.accounts:
            if account["id"] == account_id:
                return account
        return None
    
    def update_account(self, account_id: str, **updates) -> bool:
        """更新賬戶信息
        
        Args:
            account_id: 賬戶ID
            **updates: 要更新的字段
            
        Returns:
            更新是否成功
        """
        for i, account in enumerate(self.accounts):
            if account["id"] == account_id:
                self.accounts[i].update(updates)
                self._save_accounts()
                logger.info(f"更新賬戶 {account_id}: {updates}")
                return True
        
        logger.warning(f"賬戶不存在: {account_id}")
        return False
    
    def delete_account(self, account_id: str) -> bool:
        """刪除賬戶
        
        Args:
            account_id: 賬戶ID
            
        Returns:
            刪除是否成功
        """
        for i, account in enumerate(self.accounts):
            if account["id"] == account_id:
                del self.accounts[i]
                self._save_accounts()
                logger.info(f"刪除賬戶: {account_id}")
                return True
        
        logger.warning(f"賬戶不存在: {account_id}")
        return False
    
    def verify_account(self, account_id: str) -> Dict[str, Any]:
        """驗證賬戶狀態
        
        Args:
            account_id: 賬戶ID
            
        Returns:
            驗證結果
        """
        account = self.get_account(account_id)
        if not account:
            return {"success": False, "error": "賬戶不存在"}
        
        try:
            # 準備請求參數
            params = {"access_token": f"{self.app_id}|{self.app_secret}"}
            
            # 如果賬戶使用代理，設置代理
            proxies = None
            if account["use_proxy"] and account["proxy_id"]:
                proxy = next((p for p in self.proxies if p["id"] == account["proxy_id"]), None)
                if proxy:
                    proxies = {
                        "http": f"http://{proxy['ip']}:{proxy['port']}",
                        "https": f"https://{proxy['ip']}:{proxy['port']}"
                    }
            
            # 發送請求驗證賬戶
            response = requests.get(
                f"{self.base_url}/me", 
                params=params,
                proxies=proxies,
                timeout=10
            )
            
            # 更新賬戶狀態
            if response.status_code == 200:
                data = response.json()
                self.update_account(
                    account_id,
                    status="active",
                    last_login=time.strftime("%Y-%m-%d %H:%M:%S"),
                    account_info=data
                )
                return {"success": True, "data": data}
            else:
                error = response.json().get("error", {}).get("message", "未知錯誤")
                self.update_account(account_id, status="error", error=error)
                return {"success": False, "error": error}
                
        except Exception as e:
            logger.exception(f"驗證賬戶時出錯: {e}")
            self.update_account(account_id, status="error", error=str(e))
            return {"success": False, "error": str(e)}
    
    def batch_create_accounts(self, count: int, template: Dict[str, Any]) -> List[Dict[str, Any]]:
        """批量創建賬戶
        
        Args:
            count: 要創建的賬戶數量
            template: 賬戶模板，包含基本信息
            
        Returns:
            創建的賬戶列表
        """
        created_accounts = []
        
        for i in range(count):
            # 生成唯一用戶名和郵箱
            username = template.get("username", "user") + str(i+1)
            email = template.get("email", f"{username}@example.com")
            if "{number}" in email:
                email = email.replace("{number}", str(i+1))
            
            # 創建賬戶
            account = self.create_account(
                username=username,
                email=email,
                password=template.get("password", "password123"),
                use_proxy=template.get("use_proxy", False),
                **{k: v for k, v in template.items() if k not in ["username", "email", "password", "use_proxy"]}
            )
            
            created_accounts.append(account)
            
            # 添加延遲，避免過快創建
            time.sleep(random.uniform(0.5, 2.0))
        
        logger.info(f"批量創建了 {len(created_accounts)} 個賬戶")
        return created_accounts
    
    def add_proxy(self, ip: str, port: str, username: str = None, 
                  password: str = None, location: str = None) -> Dict[str, Any]:
        """添加代理
        
        Args:
            ip: 代理IP
            port: 代理端口
            username: 代理用戶名（可選）
            password: 代理密碼（可選）
            location: 代理位置（可選）
            
        Returns:
            添加的代理信息
        """
        proxy_id = f"proxy_{int(time.time())}_{random.randint(1000, 9999)}"
        
        proxy = {
            "id": proxy_id,
            "ip": ip,
            "port": port,
            "username": username,
            "password": password,
            "location": location,
            "status": "active",
            "added_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "last_used": None
        }
        
        self.proxies.append(proxy)
        save_json(self.proxies_file, self.proxies)
        
        logger.info(f"添加新代理: {ip}:{port}")
        return proxy
    
    def run(self):
        """運行賬戶管理器"""
        logger.info("賬戶管理器啟動")
        
        # 這裡可以添加賬戶管理的主要邏輯
        # 例如定期檢查賬戶狀態、輪換代理等
        
        # 示例：驗證所有賬戶
        for account in self.accounts:
            if account["status"] != "deleted":
                logger.info(f"驗證賬戶: {account['username']}")
                self.verify_account(account["id"])
                time.sleep(random.uniform(1.0, 3.0))  # 添加隨機延遲
        
        logger.info("賬戶管理器完成運行")


if __name__ == "__main__":
    # 測試代碼
    import sys
    from utils import setup_logging, load_config
    
    setup_logging()
    config = load_config("config.ini")
    
    if not config:
        logger.error("無法加載配置文件")
        sys.exit(1)
    
    manager = FacebookAccountManager(config)
    
    # 創建測試賬戶
    account = manager.create_account(
        username="test_user",
        email="test@example.com",
        password="password123",
        use_proxy=False
    )
    
    print(f"創建的賬戶: {account}")
    
    # 獲取賬戶
    retrieved = manager.get_account(account["id"])
    print(f"獲取的賬戶: {retrieved}")
    
    # 更新賬戶
    manager.update_account(account["id"], status="active")
    
    # 刪除賬戶
    manager.delete_account(account["id"])