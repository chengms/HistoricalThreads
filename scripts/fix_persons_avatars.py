#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
历史人物头像修复脚本
为缺少头像的人物分配现有图片或生成新的头像
"""

import json
import os
import hashlib
import random
from pathlib import Path
from PIL import Image
import numpy as np

def get_person_hash(person_name):
    """为人物生成稳定的哈希值"""
    return hashlib.sha1(person_name.encode('utf-8')).hexdigest()[:40]

def is_likely_portrait(image_path):
    """
    判断图片是否可能是人物肖像
    基于简单的图像特征分析：
    1. 检查图片尺寸比例（竖图更可能是肖像）
    2. 检查颜色分布（是否有肤色区域）
    """
    try:
        with Image.open(image_path) as img:
            # 获取图片尺寸
            width, height = img.size
            
            # 检查比例：竖图更可能是肖像
            if height > width * 0.8:
                return True
            
            # 转换为RGB
            img_rgb = img.convert('RGB')
            img_array = np.array(img_rgb)
            
            # 计算肤色像素比例
            # 简单的肤色范围定义 (基于YCbCr颜色空间的简化)
            r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
            
            # 肤色检测条件
            # R > G > B
            condition1 = (r > g) & (g > b)
            # R > 95, G > 40, B > 20
            condition2 = (r > 95) & (g > 40) & (b > 20)
            # 最大RGB - 最小RGB > 15
            condition3 = (np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 15
            
            # 计算满足条件的像素比例
            skin_pixels = np.sum(condition1 & condition2 & condition3)
            total_pixels = width * height
            skin_ratio = skin_pixels / total_pixels
            
            # 如果肤色像素比例大于5%，认为可能是肖像
            if skin_ratio > 0.05:
                return True
            
            return False
    except Exception as e:
        # 如果图片无法打开或处理，返回False
        return False

def get_image_files(image_dir, filter_portraits=True):
    """获取所有图片文件"""
    image_files = []
    if os.path.exists(image_dir):
        for file in os.listdir(image_dir):
            if file.endswith(('.jpg', '.png', '.jpeg', '.gif')):
                if filter_portraits:
                    full_path = os.path.join(image_dir, file)
                    if is_likely_portrait(full_path):
                        image_files.append(file)
                else:
                    image_files.append(file)
    return sorted(image_files)

def assign_avatars_to_persons():
    """为人物分配头像"""
    
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
    
    # 获取所有图片文件（过滤肖像）
    image_files = get_image_files(images_dir, filter_portraits=True)
    print(f"✅ 找到 {len(image_files)} 个可能是人物肖像的图片文件")
    
    # 检查现有头像是否是肖像，如果不是则移除
    print("\n🔍 检查现有头像是否为人物肖像...")
    persons_with_invalid_avatars = []
    for person in persons_data:
        if person.get('avatarUrl'):
            avatar_filename = person['avatarUrl'].split('/')[-1]
            avatar_path = os.path.join(images_dir, avatar_filename)
            if not is_likely_portrait(avatar_path):
                # 移除非肖像头像
                del person['avatarUrl']
                persons_with_invalid_avatars.append(person['name'])
    
    if persons_with_invalid_avatars:
        print(f"   ⚠️  移除了 {len(persons_with_invalid_avatars)} 个非肖像头像：")
        for name in persons_with_invalid_avatars:
            print(f"     - {name}")
    else:
        print(f"   ✅ 所有现有头像都是人物肖像")
    
    # 统计情况
    persons_with_avatars = [p for p in persons_data if p.get('avatarUrl')]
    persons_without_avatars = [p for p in persons_data if not p.get('avatarUrl')]
    
    print(f"\n📊 当前状态:")
    print(f"   有头像的人物: {len(persons_with_avatars)}")
    print(f"   缺少头像的人物: {len(persons_without_avatars)}")
    
    # 如果没有可用的肖像图片
    if not image_files:
        print(f"\n❌ 没有找到可用的人物肖像图片，无法分配头像")
        return
    
    # 为缺少头像的人物分配图片
    print(f"\n🔧 开始为 {len(persons_without_avatars)} 个人物分配肖像头像...")
    
    for i, person in enumerate(persons_without_avatars):
        person_name = person.get('name', '')
        if not person_name.strip():
            continue
            
        # 使用哈希值选择图片，确保每个相同的人物总是获得相同的头像
        person_hash = get_person_hash(person_name)
        hash_int = int(person_hash[:8], 16)
        selected_image_index = hash_int % len(image_files)
        selected_image = image_files[selected_image_index]
        
        # 设置头像URL
        avatar_url = f"/images/full/{selected_image}"
        person['avatarUrl'] = avatar_url
        
        print(f"   ✅ {person_name} -> {selected_image}")
    
    # 保存修复后的数据
    try:
        with open(persons_file, 'w', encoding='utf-8') as f:
            json.dump(persons_data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ 数据修复完成，已保存到: {persons_file}")
        
        # 重新统计
        final_with_avatars = [p for p in persons_data if p.get('avatarUrl')]
        final_without_avatars = [p for p in persons_data if not p.get('avatarUrl')]
        
        print(f"\n📊 修复后统计:")
        print(f"   有头像的人物: {len(final_with_avatars)}")
        print(f"   缺少头像的人物: {len(final_without_avatars)}")
        
        if len(final_without_avatars) > 0:
            print(f"\n⚠️  仍缺少头像的人物:")
            for person in final_without_avatars:
                print(f"   - {person.get('name', '未知')}")
        
    except Exception as e:
        print(f"❌ 保存修复后的数据失败: {e}")

def create_person_image_mapping():
    """创建人物与图片的映射报告"""
    
    persons_file = "d:/MyFile/Coder/HistoricalThreads/frontend/public/data/persons.json"
    
    try:
        with open(persons_file, 'r', encoding='utf-8') as f:
            persons_data = json.load(f)
    except Exception as e:
        print(f"❌ 加载人物数据失败: {e}")
        return
    
    # 创建映射报告
    mapping = []
    for person in persons_data:
        if person.get('avatarUrl'):
            mapping.append({
                "name": person.get('name', ''),
                "avatar_url": person['avatarUrl'],
                "hash": get_person_hash(person.get('name', ''))[:8]
            })
    
    # 保存映射
    mapping_file = "d:/MyFile/Coder/HistoricalThreads/scripts/person_image_mapping.json"
    try:
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
        print(f"✅ 人物图片映射已保存到: {mapping_file}")
    except Exception as e:
        print(f"❌ 保存映射失败: {e}")

if __name__ == "__main__":
    print("🎭 历史人物头像修复工具")
    print("="*50)
    
    # 修复头像
    assign_avatars_to_persons()
    
    # 创建映射
    print("\n📋 创建人物图片映射...")
    create_person_image_mapping()
    
    print("\n🎉 任务完成！")