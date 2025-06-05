#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Facebook Data Miner - 主程序

這個模塊是Facebook數據挖掘工具的主入口點，整合了賬戶管理、數據收集和數據分析功能。
可以獨立運行或作為現有TypeScript/JavaScript應用的後端擴展。
"""

import os
import sys
import json
import logging
import argparse
from configparser import ConfigParser

# 導入自定義模塊
from account_manager import FacebookAccountManager
from data_collector import FacebookDataCollector
from data_analyzer import FacebookDataAnalyzer
from utils import setup_logging, load_config

# 設置日誌
logger = logging.getLogger(__name__)


def parse_arguments():
    """解析命令行參數"""
    parser = argparse.ArgumentParser(description="Facebook數據挖掘工具")
    parser.add_argument("-c", "--config", default="config.ini", help="配置文件路徑")
    parser.add_argument("-m", "--mode", choices=["collect", "analyze", "manage", "server"], 
                        default="server", help="運行模式")
    parser.add_argument("-v", "--verbose", action="store_true", help="顯示詳細日誌")
    return parser.parse_args()


def main():
    """主函數"""
    # 解析命令行參數
    args = parse_arguments()
    
    # 設置日誌級別
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging(log_level)
    
    # 加載配置
    config = load_config(args.config)
    if not config:
        logger.error(f"無法加載配置文件: {args.config}")
        return 1
    
    logger.info("Facebook數據挖掘工具啟動")
    logger.info(f"運行模式: {args.mode}")
    
    try:
        # 初始化組件
        account_manager = FacebookAccountManager(config)
        data_collector = FacebookDataCollector(config)
        data_analyzer = FacebookDataAnalyzer(config)
        
        # 根據模式執行不同操作
        if args.mode == "collect":
            logger.info("開始數據收集...")
            data_collector.run()
        elif args.mode == "analyze":
            logger.info("開始數據分析...")
            data_analyzer.run()
        elif args.mode == "manage":
            logger.info("開始賬戶管理...")
            account_manager.run()
        elif args.mode == "server":
            logger.info("啟動API服務器...")
            from api_server import start_server
            start_server(account_manager, data_collector, data_analyzer, config)
        
        logger.info("操作完成")
        return 0
    
    except Exception as e:
        logger.exception(f"運行時錯誤: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())