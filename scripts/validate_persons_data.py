#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
历史人物数据验证脚本
验证人物数据完整性和图片对应关系
"""

import json
import os
import hashlib
from pathlib import Path

def validate_persons_data():
    """验证人物数据完整性和图片对应关系"""
    
    # 文件路径
    persons_file = "d:/MyFile/Coder/HistoricalThreads/frontend/public/data/persons.json"
    images_dir = "d:/MyFile/Coder/HistoricalThreads/frontend/public/images/full"
    
    # 加载人物数据
    try:
        with open(persons_file, 'r', encoding='utf-8') as f:
            persons_data = json.load(f)
        print(f"✅ 成功加载 {len(persons_data)} 个人物记录")
    except Exception as e:
        print(f"❌ 加载人物数据失败: {e}")
        return
    
    # 获取所有图片文件
    try:
        image_files = set()
        if os.path.exists(images_dir):
            for file in os.listdir(images_dir):
                if file.endswith(('.jpg', '.png', '.jpeg', '.gif')):
                    image_files.add(file)
        print(f"✅ 找到 {len(image_files)} 个图片文件")
    except Exception as e:
        print(f"❌ 扫描图片目录失败: {e}")
        return
    
    # 验证报告
    report = {
        "summary": {
            "total_persons": len(persons_data),
            "total_images": len(image_files),
            "persons_with_avatars": 0,
            "persons_without_avatars": 0,
            "missing_images": [],
            "duplicate_names": [],
            "data_issues": []
        },
        "person_details": [],
        "image_files": list(image_files)
    }
    
    # 检查重复姓名
    name_counts = {}
    for person in persons_data:
        name = person.get('name', '')
        name_counts[name] = name_counts.get(name, 0) + 1
    
    duplicate_names = [name for name, count in name_counts.items() if count > 1]
    if duplicate_names:
        report["summary"]["duplicate_names"] = duplicate_names
        print(f"⚠️  发现重复姓名: {duplicate_names}")
    
    # 验证每个人物
    for i, person in enumerate(persons_data):
        person_info = {
            "index": i,
            "name": person.get('name', ''),
            "has_avatar_url": False,
            "avatar_url": person.get('avatarUrl'),
            "image_exists": False,
            "issues": []
        }
        
        # 检查头像URL
        avatar_url = person.get('avatarUrl')
        if avatar_url:
            report["summary"]["persons_with_avatars"] += 1
            person_info["has_avatar_url"] = True
            
            # 提取图片文件名
            if avatar_url.startswith('/images/full/'):
                image_filename = avatar_url.replace('/images/full/', '')
                person_info["image_filename"] = image_filename
                
                # 检查图片文件是否存在
                image_path = os.path.join(images_dir, image_filename)
                if os.path.exists(image_path):
                    person_info["image_exists"] = True
                else:
                    person_info["image_exists"] = False
                    report["summary"]["missing_images"].append(image_filename)
                    person_info["issues"].append(f"图片文件不存在: {image_filename}")
                    print(f"❌ {person['name']}: 图片文件不存在 - {image_filename}")
            else:
                person_info["issues"].append(f"头像URL格式错误: {avatar_url}")
                print(f"❌ {person['name']}: 头像URL格式错误 - {avatar_url}")
        else:
            report["summary"]["persons_without_avatars"] += 1
            person_info["issues"].append("缺少头像URL")
            print(f"⚠️  {person['name']}: 缺少头像URL")
        
        report["person_details"].append(person_info)
    
    # 输出验证结果
    print("\n" + "="*60)
    print("📊 验证报告摘要")
    print("="*60)
    print(f"总人物数量: {report['summary']['total_persons']}")
    print(f"总图片数量: {report['summary']['total_images']}")
    print(f"有头像的人物: {report['summary']['persons_with_avatars']}")
    print(f"无头像的人物: {report['summary']['persons_without_avatars']}")
    print(f"缺失的图片: {len(report['summary']['missing_images'])}")
    print(f"重复姓名: {len(report['summary']['duplicate_names'])}")
    
    if report['summary']['missing_images']:
        print(f"\n❌ 缺失的图片文件:")
        for img in report['summary']['missing_images']:
            print(f"   - {img}")
    
    if report['summary']['duplicate_names']:
        print(f"\n⚠️  重复的姓名:")
        for name in report['summary']['duplicate_names']:
            print(f"   - {name}")
    
    # 保存验证报告
    report_file = "d:/MyFile/Coder/HistoricalThreads/scripts/data_validation_report.json"
    try:
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 验证报告已保存到: {report_file}")
    except Exception as e:
        print(f"❌ 保存验证报告失败: {e}")
    
    return report

if __name__ == "__main__":
    validate_persons_data()