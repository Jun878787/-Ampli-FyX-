#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
工具函數模塊

這個模塊提供各種工具函數，包括：
- 日誌設置
- 配置加載
- JSON文件處理
- HTTP請求處理
- 代理管理
- 錯誤處理
"""

import os
import json
import time
import random
import logging
import requests
import configparser
from typing import Dict, List, Optional, Union, Any
from datetime import datetime, timedelta

# 設置日誌格式
def setup_logging(log_level: str = "INFO", log_file: str = None) -> None:
    """設置日誌
    
    Args:
        log_level: 日誌級別
        log_file: 日誌文件路徑
    """
    # 創建日誌目錄
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
    
    # 設置日誌級別
    numeric_level = getattr(logging, log_level.upper(), None)
    if not isinstance(numeric_level, int):
        numeric_level = logging.INFO
    
    # 配置日誌格式
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # 設置日誌處理器
    handlers = []
    
    # 控制台處理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    handlers.append(console_handler)
    
    # 文件處理器
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(logging.Formatter(log_format, date_format))
        handlers.append(file_handler)
    
    # 配置根日誌記錄器
    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        datefmt=date_format,
        handlers=handlers
    )

# 加載配置文件
def load_config(config_file: str) -> configparser.ConfigParser:
    """加載配置文件
    
    Args:
        config_file: 配置文件路徑
        
    Returns:
        配置對象
    """
    if not os.path.exists(config_file):
        logging.error(f"配置文件不存在: {config_file}")
        return None
    
    try:
        config = configparser.ConfigParser()
        config.read(config_file, encoding="utf-8")
        logging.info(f"已加載配置文件: {config_file}")
        return config
    except Exception as e:
        logging.exception(f"加載配置文件時出錯: {e}")
        return None

# 創建默認配置文件
def create_default_config(config_file: str) -> bool:
    """創建默認配置文件
    
    Args:
        config_file: 配置文件路徑
        
    Returns:
        是否成功創建
    """
    if os.path.exists(config_file):
        logging.warning(f"配置文件已存在: {config_file}")
        return False
    
    try:
        config = configparser.ConfigParser()
        
        # API設置
        config["API"] = {
            "facebook_app_id": "YOUR_APP_ID",
            "facebook_app_secret": "YOUR_APP_SECRET",
            "facebook_api_version": "v18.0",
            "request_timeout": "30",
            "max_retries": "3",
            "retry_delay": "5"
        }
        
        # 文件路徑設置
        config["Files"] = {
            "accounts_file": "data/accounts.json",
            "proxies_file": "data/proxies.json",
            "data_dir": "data",
            "reports_dir": "reports",
            "logs_dir": "logs"
        }
        
        # 代理設置
        config["Proxy"] = {
            "use_proxy": "False",
            "proxy_rotation": "True",
            "proxy_timeout": "10"
        }
        
        # 數據收集設置
        config["Collection"] = {
            "max_items": "100",
            "rate_limit_calls": "10",
            "rate_limit_period": "60",
            "save_interval": "50"
        }
        
        # 日誌設置
        config["Logging"] = {
            "log_level": "INFO",
            "log_file": "logs/fb_data_miner.log",
            "log_to_console": "True"
        }
        
        # 寫入配置文件
        config_dir = os.path.dirname(config_file)
        if config_dir and not os.path.exists(config_dir):
            os.makedirs(config_dir, exist_ok=True)
            
        with open(config_file, "w", encoding="utf-8") as f:
            config.write(f)
        
        logging.info(f"已創建默認配置文件: {config_file}")
        return True
    except Exception as e:
        logging.exception(f"創建默認配置文件時出錯: {e}")
        return False

# JSON文件處理
def load_json(file_path: str) -> Any:
    """加載JSON文件
    
    Args:
        file_path: JSON文件路徑
        
    Returns:
        加載的JSON數據
    """
    if not os.path.exists(file_path):
        logging.warning(f"JSON文件不存在: {file_path}")
        return None
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        logging.debug(f"已加載JSON文件: {file_path}")
        return data
    except Exception as e:
        logging.exception(f"加載JSON文件時出錯: {e}")
        return None

def save_json(file_path: str, data: Any, indent: int = 4) -> bool:
    """保存JSON文件
    
    Args:
        file_path: JSON文件路徑
        data: 要保存的數據
        indent: 縮進空格數
        
    Returns:
        是否成功保存
    """
    try:
        # 創建目錄
        file_dir = os.path.dirname(file_path)
        if file_dir and not os.path.exists(file_dir):
            os.makedirs(file_dir, exist_ok=True)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=indent)
        logging.debug(f"已保存JSON文件: {file_path}")
        return True
    except Exception as e:
        logging.exception(f"保存JSON文件時出錯: {e}")
        return False

# HTTP請求處理
def make_request(url: str, method: str = "GET", params: Dict = None, 
                data: Dict = None, headers: Dict = None, proxy: str = None, 
                timeout: int = 30, max_retries: int = 3, retry_delay: int = 5) -> Dict:
    """發送HTTP請求
    
    Args:
        url: 請求URL
        method: 請求方法
        params: URL參數
        data: 請求數據
        headers: 請求頭
        proxy: 代理地址
        timeout: 超時時間（秒）
        max_retries: 最大重試次數
        retry_delay: 重試延遲（秒）
        
    Returns:
        響應結果
    """
    method = method.upper()
    proxies = {"http": proxy, "https": proxy} if proxy else None
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.request(
                method=method,
                url=url,
                params=params,
                json=data if method in ["POST", "PUT", "PATCH"] else None,
                headers=headers,
                proxies=proxies,
                timeout=timeout
            )
            
            # 檢查響應狀態
            response.raise_for_status()
            
            # 嘗試解析JSON
            try:
                result = response.json()
            except ValueError:
                result = {"text": response.text}
            
            return {
                "success": True,
                "status_code": response.status_code,
                "data": result,
                "headers": dict(response.headers)
            }
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                # 計算延遲時間（指數退避）
                delay = retry_delay * (2 ** attempt) + random.uniform(0, 1)
                logging.warning(f"請求失敗，{delay:.2f}秒後重試 ({attempt+1}/{max_retries}): {e}")
                time.sleep(delay)
            else:
                logging.error(f"請求失敗，已達到最大重試次數: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "error_type": type(e).__name__
                }

# 代理管理
class ProxyManager:
    """代理管理器"""
    
    def __init__(self, proxies_file: str = None):
        """初始化代理管理器
        
        Args:
            proxies_file: 代理文件路徑
        """
        self.proxies = []
        self.current_index = 0
        self.proxies_file = proxies_file
        
        if proxies_file:
            self.load_proxies(proxies_file)
    
    def load_proxies(self, proxies_file: str) -> bool:
        """加載代理列表
        
        Args:
            proxies_file: 代理文件路徑
            
        Returns:
            是否成功加載
        """
        proxies_data = load_json(proxies_file)
        if not proxies_data:
            return False
        
        if isinstance(proxies_data, list):
            self.proxies = proxies_data
        elif isinstance(proxies_data, dict) and "proxies" in proxies_data:
            self.proxies = proxies_data["proxies"]
        else:
            logging.error(f"代理文件格式錯誤: {proxies_file}")
            return False
        
        logging.info(f"已加載 {len(self.proxies)} 個代理")
        return True
    
    def save_proxies(self, proxies_file: str = None) -> bool:
        """保存代理列表
        
        Args:
            proxies_file: 代理文件路徑
            
        Returns:
            是否成功保存
        """
        file_path = proxies_file or self.proxies_file
        if not file_path:
            logging.error("未指定代理文件路徑")
            return False
        
        return save_json(file_path, {"proxies": self.proxies})
    
    def add_proxy(self, proxy: str) -> bool:
        """添加代理
        
        Args:
            proxy: 代理地址
            
        Returns:
            是否成功添加
        """
        if not proxy or not isinstance(proxy, str):
            return False
        
        if proxy not in self.proxies:
            self.proxies.append(proxy)
            logging.info(f"已添加代理: {proxy}")
            return True
        return False
    
    def remove_proxy(self, proxy: str) -> bool:
        """移除代理
        
        Args:
            proxy: 代理地址
            
        Returns:
            是否成功移除
        """
        if proxy in self.proxies:
            self.proxies.remove(proxy)
            logging.info(f"已移除代理: {proxy}")
            return True
        return False
    
    def get_proxy(self, rotation: bool = True) -> str:
        """獲取代理
        
        Args:
            rotation: 是否輪換代理
            
        Returns:
            代理地址
        """
        if not self.proxies:
            return None
        
        if rotation:
            # 輪換代理
            proxy = self.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxies)
        else:
            # 隨機代理
            proxy = random.choice(self.proxies)
        
        return proxy
    
    def test_proxy(self, proxy: str, test_url: str = "https://www.google.com", timeout: int = 10) -> bool:
        """測試代理
        
        Args:
            proxy: 代理地址
            test_url: 測試URL
            timeout: 超時時間（秒）
            
        Returns:
            代理是否可用
        """
        try:
            proxies = {"http": proxy, "https": proxy}
            response = requests.get(test_url, proxies=proxies, timeout=timeout)
            return response.status_code == 200
        except Exception as e:
            logging.debug(f"代理測試失敗: {proxy}, 錯誤: {e}")
            return False

# 錯誤處理
class APIError(Exception):
    """API錯誤"""
    
    def __init__(self, message: str, code: str = None, http_status: int = None):
        """初始化API錯誤
        
        Args:
            message: 錯誤消息
            code: 錯誤代碼
            http_status: HTTP狀態碼
        """
        self.message = message
        self.code = code
        self.http_status = http_status
        super().__init__(self.message)

# 速率限制
class RateLimiter:
    """速率限制器"""
    
    def __init__(self, max_calls: int, period: int):
        """初始化速率限制器
        
        Args:
            max_calls: 時間段內最大調用次數
            period: 時間段（秒）
        """
        self.max_calls = max_calls
        self.period = period
        self.calls = []
    
    def wait_if_needed(self) -> float:
        """如果需要，等待一段時間
        
        Returns:
            等待時間（秒）
        """
        now = time.time()
        
        # 清理過期的調用記錄
        self.calls = [call_time for call_time in self.calls if now - call_time <= self.period]
        
        # 檢查是否需要等待
        if len(self.calls) >= self.max_calls:
            oldest_call = self.calls[0]
            wait_time = self.period - (now - oldest_call)
            if wait_time > 0:
                logging.debug(f"速率限制：等待 {wait_time:.2f} 秒")
                time.sleep(wait_time)
                return wait_time
        
        # 記錄本次調用
        self.calls.append(time.time())
        return 0.0

# 時間處理
def parse_facebook_date(date_str: str) -> datetime:
    """解析Facebook日期字符串
    
    Args:
        date_str: Facebook日期字符串
        
    Returns:
        日期時間對象
    """
    try:
        # 處理常見的Facebook日期格式
        if "T" in date_str:
            # ISO格式：2023-01-01T12:00:00+0000
            if "+" in date_str:
                dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S%z")
            else:
                dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        else:
            # 其他格式：2023-01-01 12:00:00
            dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        return dt
    except Exception as e:
        logging.warning(f"解析日期時出錯: {date_str}, {e}")
        return None

# 主函數
if __name__ == "__main__":
    # 測試代碼
    setup_logging(log_level="DEBUG")
    logging.info("測試工具函數模塊")
    
    # 測試配置文件
    if not os.path.exists("config.ini"):
        create_default_config("config.ini")
    
    config = load_config("config.ini")
    if config:
        logging.info(f"API版本: {config.get('API', 'facebook_api_version')}")
    
    # 測試JSON處理
    test_data = {"test": True, "message": "這是測試數據"}
    save_json("test.json", test_data)
    loaded_data = load_json("test.json")
    logging.info(f"加載的測試數據: {loaded_data}")
    
    # 測試HTTP請求
    response = make_request("https://httpbin.org/get")
    logging.info(f"HTTP請求結果: {response['success']}")
    
    # 測試代理管理
    proxy_manager = ProxyManager()
    proxy_manager.add_proxy("http://127.0.0.1:8080")
    proxy_manager.add_proxy("http://127.0.0.1:8081")
    logging.info(f"獲取代理: {proxy_manager.get_proxy()}")
    
    # 測試速率限制
    rate_limiter = RateLimiter(max_calls=3, period=5)
    for i in range(5):
        wait_time = rate_limiter.wait_if_needed()
        logging.info(f"調用 {i+1}, 等待時間: {wait_time:.2f}秒")