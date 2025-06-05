#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
導出工具模塊

這個模塊提供數據導出功能，包括：
- Excel文件生成
- CSV文件生成
- 數據格式化
"""

import os
import json
import logging
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime

# 設置日誌記錄器
logger = logging.getLogger(__name__)


def export_to_excel(data: List[Dict[str, Any]], output_path: str, sheet_name: str = "廣告內容") -> Dict[str, Any]:
    """
    將數據導出為Excel文件
    
    Args:
        data: 要導出的數據列表
        output_path: 輸出文件路徑
        sheet_name: Excel工作表名稱
        
    Returns:
        包含導出結果的字典
    """
    try:
        # 確保輸出目錄存在
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # 將數據轉換為DataFrame
        df = pd.DataFrame(data)
        
        # 重命名列以便於閱讀
        column_mapping = {
            "id": "ID",
            "adId": "廣告ID",
            "name": "廣告名稱",
            "headline": "標題",
            "primaryText": "主要文本",
            "description": "描述",
            "callToAction": "行動號召",
            "contentType": "內容類型",
            "imageUrl": "圖片URL",
            "videoId": "視頻ID",
            "linkUrl": "鏈接URL",
            "impressions": "展示次數",
            "clicks": "點擊次數",
            "ctr": "點擊率",
            "cpc": "每次點擊成本",
            "spend": "花費",
            "reach": "觸及人數",
            "frequency": "頻率",
            "status": "狀態",
            "createdAt": "創建時間"
        }
        
        # 處理嵌套字段
        if "audienceAnalysis" in df.columns:
            df["受眾年齡範圍"] = df["audienceAnalysis"].apply(lambda x: x.get("ageRange") if isinstance(x, dict) else "")
            df["受眾性別"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("genders", [])) if isinstance(x, dict) else "")
            df["受眾地區"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("locations", [])) if isinstance(x, dict) else "")
            df["受眾興趣"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("interests", [])) if isinstance(x, dict) else "")
            df["受眾行為"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("behaviors", [])) if isinstance(x, dict) else "")
            df = df.drop(columns=["audienceAnalysis"])
        
        if "potentialCustomers" in df.columns:
            df["估計觸及人數"] = df["potentialCustomers"].apply(lambda x: x.get("estimatedReach") if isinstance(x, dict) else 0)
            df["參與率"] = df["potentialCustomers"].apply(lambda x: x.get("engagementRate") if isinstance(x, dict) else "0")
            df["每個潛在客戶成本"] = df["potentialCustomers"].apply(lambda x: x.get("costPerLead") if isinstance(x, dict) else "0")
            df["質量評分"] = df["potentialCustomers"].apply(lambda x: x.get("qualityScore") if isinstance(x, dict) else "0")
            df = df.drop(columns=["potentialCustomers"])
        
        # 重命名列
        df = df.rename(columns=column_mapping)
        
        # 創建Excel寫入器
        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            # 寫入數據
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # 獲取工作表
            worksheet = writer.sheets[sheet_name]
            
            # 調整列寬
            for idx, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).map(len).max(),
                    len(col)
                ) + 2  # 添加一些額外空間
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)  # 限制最大寬度
        
        return {
            "success": True,
            "file_path": output_path,
            "row_count": len(df),
            "column_count": len(df.columns)
        }
    
    except Exception as e:
        logger.exception(f"導出Excel文件時出錯: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def export_to_csv(data: List[Dict[str, Any]], output_path: str) -> Dict[str, Any]:
    """
    將數據導出為CSV文件
    
    Args:
        data: 要導出的數據列表
        output_path: 輸出文件路徑
        
    Returns:
        包含導出結果的字典
    """
    try:
        # 確保輸出目錄存在
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # 將數據轉換為DataFrame
        df = pd.DataFrame(data)
        
        # 處理嵌套字段
        if "audienceAnalysis" in df.columns:
            df["audience_age_range"] = df["audienceAnalysis"].apply(lambda x: x.get("ageRange") if isinstance(x, dict) else "")
            df["audience_genders"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("genders", [])) if isinstance(x, dict) else "")
            df["audience_locations"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("locations", [])) if isinstance(x, dict) else "")
            df["audience_interests"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("interests", [])) if isinstance(x, dict) else "")
            df["audience_behaviors"] = df["audienceAnalysis"].apply(lambda x: ", ".join(x.get("behaviors", [])) if isinstance(x, dict) else "")
            df = df.drop(columns=["audienceAnalysis"])
        
        if "potentialCustomers" in df.columns:
            df["estimated_reach"] = df["potentialCustomers"].apply(lambda x: x.get("estimatedReach") if isinstance(x, dict) else 0)
            df["engagement_rate"] = df["potentialCustomers"].apply(lambda x: x.get("engagementRate") if isinstance(x, dict) else "0")
            df["cost_per_lead"] = df["potentialCustomers"].apply(lambda x: x.get("costPerLead") if isinstance(x, dict) else "0")
            df["quality_score"] = df["potentialCustomers"].apply(lambda x: x.get("qualityScore") if isinstance(x, dict) else "0")
            df = df.drop(columns=["potentialCustomers"])
        
        # 寫入CSV文件
        df.to_csv(output_path, index=False, encoding="utf-8-sig")  # 使用帶BOM的UTF-8以支持Excel正確顯示中文
        
        return {
            "success": True,
            "file_path": output_path,
            "row_count": len(df),
            "column_count": len(df.columns)
        }
    
    except Exception as e:
        logger.exception(f"導出CSV文件時出錯: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def export_data(data: List[Dict[str, Any]], format: str, output_dir: str, filename_prefix: str = "facebook_ad_contents") -> Dict[str, Any]:
    """
    根據指定格式導出數據
    
    Args:
        data: 要導出的數據列表
        format: 導出格式 (excel, csv)
        output_dir: 輸出目錄
        filename_prefix: 文件名前綴
        
    Returns:
        包含導出結果的字典
    """
    try:
        # 確保輸出目錄存在
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # 生成時間戳
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 根據格式導出數據
        if format.lower() == "excel":
            output_path = os.path.join(output_dir, f"{filename_prefix}_{timestamp}.xlsx")
            result = export_to_excel(data, output_path)
        elif format.lower() == "csv":
            output_path = os.path.join(output_dir, f"{filename_prefix}_{timestamp}.csv")
            result = export_to_csv(data, output_path)
        else:
            return {
                "success": False,
                "error": f"不支持的導出格式: {format}"
            }
        
        # 添加額外信息
        if result["success"]:
            result["format"] = format.lower()
            result["timestamp"] = timestamp
            result["filename"] = os.path.basename(output_path)
        
        return result
    
    except Exception as e:
        logger.exception(f"導出數據時出錯: {e}")
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # 設置日誌
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    # 測試數據
    test_data = [
        {
            "id": "123456789",
            "adId": "123456789",
            "name": "測試廣告1",
            "headline": "測試標題1",
            "primaryText": "這是一個測試廣告",
            "description": "測試描述",
            "callToAction": "立即購買",
            "contentType": "single_image",
            "imageUrl": "https://example.com/image1.jpg",
            "videoId": None,
            "linkUrl": "https://example.com/product1",
            "impressions": 1000,
            "clicks": 50,
            "ctr": 5.0,
            "cpc": 0.5,
            "spend": 25.0,
            "reach": 800,
            "frequency": 1.25,
            "audienceAnalysis": {
                "ageRange": "18-35",
                "genders": ["male", "female"],
                "locations": ["Hong Kong", "Taiwan"],
                "interests": ["科技", "電子產品"],
                "behaviors": ["網上購物"]
            },
            "potentialCustomers": {
                "estimatedReach": 800,
                "engagementRate": "5.0",
                "costPerLead": "0.5",
                "qualityScore": "75"
            },
            "status": "ACTIVE",
            "createdAt": "2023-01-01T00:00:00Z"
        },
        {
            "id": "987654321",
            "adId": "987654321",
            "name": "測試廣告2",
            "headline": "測試標題2",
            "primaryText": "這是另一個測試廣告",
            "description": "另一個測試描述",
            "callToAction": "了解更多",
            "contentType": "video",
            "imageUrl": None,
            "videoId": "123456789",
            "linkUrl": "https://example.com/product2",
            "impressions": 2000,
            "clicks": 100,
            "ctr": 5.0,
            "cpc": 0.4,
            "spend": 40.0,
            "reach": 1500,
            "frequency": 1.33,
            "audienceAnalysis": {
                "ageRange": "25-45",
                "genders": ["female"],
                "locations": ["Hong Kong"],
                "interests": ["美容", "時尚"],
                "behaviors": ["高端購物"]
            },
            "potentialCustomers": {
                "estimatedReach": 1500,
                "engagementRate": "5.0",
                "costPerLead": "0.4",
                "qualityScore": "85"
            },
            "status": "ACTIVE",
            "createdAt": "2023-01-02T00:00:00Z"
        }
    ]
    
    # 測試Excel導出
    excel_result = export_data(test_data, "excel", "./output")
    print(f"Excel導出結果: {excel_result}")
    
    # 測試CSV導出
    csv_result = export_data(test_data, "csv", "./output")
    print(f"CSV導出結果: {csv_result}")