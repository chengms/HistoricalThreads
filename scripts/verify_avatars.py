#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
头像验证脚本
检查修复后的人物头像情况
"""

import json
import os

# 文件路径
persons_file = "d:/MyFile/Coder/HistoricalThreads/frontend/public/data/persons.json"
images_dir = "d:/MyFile/Coder/HistoricalThreads/frontend/public/images/full"

# 加载人物数据
with open(persons_file, 'r', encoding='utf-8') as f:
    persons_data = json.load(f)

print("🎭 头像验证报告")
print("="*50)
print(f"总共有 {len(persons_data)} 个人物记录")

# 统计有头像和无头像的人物
persons_with_avatars = [p for p in persons_data if p.get('avatarUrl')]
persons_without_avatars = [p for p in persons_data if not p.get('avatarUrl')]

print(f"\n📊 头像情况统计:")
print(f"   有头像的人物: {len(persons_with_avatars)} ({len(persons_with_avatars)/len(persons_data)*100:.1f}%)")
print(f"   无头像的人物: {len(persons_without_avatars)} ({len(persons_without_avatars)/len(persons_data)*100:.1f}%)")

# 检查齐桓公的头像
print("\n🔍 特定人物头像检查:")
for person in persons_data:
    if person['name'] == '齐桓公':
        if person.get('avatarUrl'):
            avatar_filename = person['avatarUrl'].split('/')[-1]
            avatar_path = os.path.join(images_dir, avatar_filename)
            print(f"   ✅ 齐桓公的头像: {avatar_filename}")
            print(f"      头像URL: {person['avatarUrl']}")
            print(f"      头像文件存在: {os.path.exists(avatar_path)}")
        else:
            print(f"   ❌ 齐桓公没有头像")
        break

# 检查其他一些重要人物的头像
important_persons = ['孔子', '秦始皇', '汉武帝', '唐太宗']
print("\n🔍 重要人物头像检查:")
for person_name in important_persons:
    for person in persons_data:
        if person['name'] == person_name:
            if person.get('avatarUrl'):
                print(f"   ✅ {person_name} 有头像")
            else:
                print(f"   ❌ {person_name} 没有头像")
            break

print("\n🎉 验证完成！")
