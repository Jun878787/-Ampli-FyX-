#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Facebook廣告內容導出腳本

這個腳本用於導出Facebook廣告內容數據，支持Excel和CSV格式。

用法:
    python export_ad_contents.py --input <input_file> --format <format> --output <output_dir>

參數:
    --input: 輸入JSON文件路徑
    --format: 導出格式 (excel, csv)
    --output: 輸出目錄
"""

import os
import sys
import json
import logging
import argparse
from typing import Dict, List, Any, Optional
from datetime import datetime

# 導入導出工具
from export_utils import export_data
from utils import setup_logging

# 設置日誌記錄器
logger = logging.getLogger(__name__)


def parse_arguments():
    """
    解析命令行參數
    
    Returns:
        解析後的參數
    """
    parser = argparse.ArgumentParser(description="Facebook廣告內容導出工具")
    parser.add_argument("--input", "-i", required=True, help="輸入JSON文件路徑")
    parser.add_argument("--format", "-f", default="excel", choices=["excel", "csv"], help="導出格式 (excel, csv)")
    parser.add_argument("--output", "-o", default="./output", help="輸出目錄")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], help="日誌級別")
    
    return parser.parse_args()


def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """
    加載JSON數據
    
    Args:
        file_path: JSON文件路徑
        
    Returns:
        JSON數據列表
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # 確保數據是列表格式
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        elif isinstance(data, list):
            return data
        else:
            logger.warning(f"未知的數據格式: {type(data)}")
            return []
    
    except Exception as e:
        logger.exception(f"加載JSON數據時出錯: {e}")
        return []


def main():
    """
    主函數
    """
    # 解析命令行參數
    args = parse_arguments()
    
    # 設置日誌
    setup_logging(args.log_level)
    
    # 顯示開始信息
    logger.info(f"開始導出Facebook廣告內容 (格式: {args.format})")
    
    # 檢查輸入文件
    if not os.path.exists(args.input):
        logger.error(f"輸入文件不存在: {args.input}")
        sys.exit(1)
    
    # 加載數據
    logger.info(f"正在加載數據: {args.input}")
    data = load_json_data(args.input)
    
    if not data:
        logger.error("沒有找到有效數據")
        sys.exit(1)
    
    logger.info(f"已加載 {len(data)} 條廣告內容記錄")
    
    # 導出數據
    logger.info(f"正在導出數據到 {args.format} 格式")
    result = export_data(data, args.format, args.output)
    
    # 顯示結果
    if result["success"]:
        logger.info(f"導出成功: {result['file_path']}")
        logger.info(f"導出了 {result['row_count']} 條記錄, {result['column_count']} 個欄位")
        
        # 輸出結果JSON
        output_json = {
            "success": True,
            "file_path": result["file_path"],
            "format": args.format,
            "row_count": result["row_count"],
            "column_count": result["column_count"],
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(output_json))
        return 0
    else:
        logger.error(f"導出失敗: {result['error']}")
        
        # 輸出錯誤JSON
        error_json = {
            "success": False,
            "error": result["error"],
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_json))
        return 1


if __name__ == "__main__":
    sys.exit(main())