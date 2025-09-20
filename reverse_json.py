#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 grammarpoint_upperpart_order.json 文件的内容按照从后往前的顺序写入到 grammarpoint_upperpart_reverse.json 文件中
"""

import json
import os

def reverse_json_file():
    # 文件路径
    input_file = "assets/data/grammarpoint_upperpart_order.json"
    output_file = "assets/data/grammarpoint_upperpart_reverse.json"
    
    try:
        # 读取原始JSON文件
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"成功读取文件: {input_file}")
        print(f"原始数据包含 {len(data)} 个题目")
        
        # 将数组反转
        reversed_data = data[::-1]
        
        print(f"反转后数据包含 {len(reversed_data)} 个题目")
        
        # 写入反转后的数据到新文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(reversed_data, f, ensure_ascii=False, indent=2)
        
        print(f"成功写入文件: {output_file}")
        
        # 验证结果
        print("\n验证结果:")
        print(f"第一个题目: {reversed_data[0]['question']}")
        print(f"最后一个题目: {reversed_data[-1]['question']}")
        
    except FileNotFoundError as e:
        print(f"错误: 找不到文件 {e}")
    except json.JSONDecodeError as e:
        print(f"错误: JSON解析失败 {e}")
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    reverse_json_file()
