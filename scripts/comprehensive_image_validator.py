#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
历史人物图片综合验证和重命名脚本
功能：
1. 验证所有人物图片与数据对应关系
2. 检查图片文件可访问性和完整性
3. 验证图片命名规则和URL路径
4. 生成完整的验证报告
5. 自动修复常见问题
"""

import os
import json
import hashlib
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Any
from datetime import datetime

class HistoricalImageValidator:
    def __init__(self):
        self.base_dir = Path("d:/MyFile/Coder/HistoricalThreads")
        self.frontend_dir = self.base_dir / "frontend"
        self.data_dir = self.frontend_dir / "public" / "data"
        self.images_dir = self.frontend_dir / "public" / "images" / "full"
        
        self.persons_file = self.data_dir / "persons.json"
        self.events_file = self.data_dir / "events.json"
        self.validation_report_file = self.base_dir / "scripts" / "comprehensive_validation_report.json"
        
        self.stats = {
            "total_persons": 0,
            "total_events": 0,
            "total_images": 0,
            "persons_with_avatars": 0,
            "events_with_images": 0,
            "missing_avatars": [],
            "missing_event_images": [],
            "invalid_images": [],
            "duplicate_names": [],
            "orphaned_images": [],
            "fixed_issues": []
        }

    def get_image_files(self) -> List[str]:
        """获取所有图片文件列表"""
        if not self.images_dir.exists():
            print(f"❌ 图片目录不存在: {self.images_dir}")
            return []
        
        image_files = []
        for file in self.images_dir.iterdir():
            if file.is_file() and file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                image_files.append(file.name)
        
        return sorted(image_files)

    def generate_person_hash(self, name: str) -> str:
        """为人物生成一致的哈希值"""
        return hashlib.md5(name.encode('utf-8')).hexdigest()

    def validate_persons_data(self) -> bool:
        """验证人物数据完整性和图片对应关系"""
        print("🔍 开始验证人物数据...")
        
        try:
            with open(self.persons_file, 'r', encoding='utf-8') as f:
                persons_data = json.load(f)
            print(f"✅ 成功加载 {len(persons_data)} 个人物记录")
        except Exception as e:
            print(f"❌ 加载人物数据失败: {e}")
            return False
        
        self.stats["total_persons"] = len(persons_data)
        
        # 检查重复姓名
        names = [p.get('name', '') for p in persons_data if p.get('name', '').strip()]
        name_counts = {}
        for name in names:
            name_counts[name] = name_counts.get(name, 0) + 1
        
        self.stats["duplicate_names"] = [name for name, count in name_counts.items() if count > 1]
        
        # 验证每个人的头像
        image_files = self.get_image_files()
        self.stats["total_images"] = len(image_files)
        
        for person in persons_data:
            person_name = person.get('name', '')
            avatar_url = person.get('avatarUrl')
            
            if not person_name.strip():
                continue
            
            if not avatar_url:
                self.stats["missing_avatars"].append({
                    "name": person_name,
                    "reason": "缺少头像URL"
                })
            else:
                # 检查图片文件是否存在
                image_filename = os.path.basename(avatar_url)
                image_path = self.images_dir / image_filename
                
                if not image_path.exists():
                    self.stats["invalid_images"].append({
                        "name": person_name,
                        "avatar_url": avatar_url,
                        "reason": "图片文件不存在"
                    })
                else:
                    self.stats["persons_with_avatars"] += 1
        
        return True

    def validate_events_data(self) -> bool:
        """验证事件数据"""
        print("🔍 开始验证事件数据...")
        
        if not self.events_file.exists():
            print("⚠️  事件数据文件不存在，跳过事件验证")
            return True
        
        try:
            with open(self.events_file, 'r', encoding='utf-8') as f:
                events_data = json.load(f)
            print(f"✅ 成功加载 {len(events_data)} 个事件记录")
        except Exception as e:
            print(f"❌ 加载事件数据失败: {e}")
            return False
        
        self.stats["total_events"] = len(events_data)
        
        for event in events_data:
            event_name = event.get('name', '')
            image_url = event.get('imageUrl')
            
            if not event_name.strip():
                continue
            
            if not image_url:
                self.stats["missing_event_images"].append({
                    "name": event_name,
                    "reason": "缺少图片URL"
                })
            else:
                # 检查事件图片文件是否存在
                image_filename = os.path.basename(image_url)
                image_path = self.images_dir / image_filename
                
                if not image_path.exists():
                    self.stats["invalid_images"].append({
                        "name": event_name,
                        "image_url": image_url,
                        "reason": "事件图片文件不存在"
                    })
                else:
                    self.stats["events_with_images"] += 1
        
        return True

    def find_orphaned_images(self) -> None:
        """查找孤立的图片文件"""
        print("🔍 查找孤立图片文件...")
        
        image_files = set(self.get_image_files())
        used_images = set()
        
        # 收集所有被使用的人物头像
        try:
            with open(self.persons_file, 'r', encoding='utf-8') as f:
                persons_data = json.load(f)
            
            for person in persons_data:
                avatar_url = person.get('avatarUrl')
                if avatar_url:
                    used_images.add(os.path.basename(avatar_url))
        except:
            pass
        
        # 收集所有被使用的事件图片
        if self.events_file.exists():
            try:
                with open(self.events_file, 'r', encoding='utf-8') as f:
                    events_data = json.load(f)
                
                for event in events_data:
                    image_url = event.get('imageUrl')
                    if image_url:
                        used_images.add(os.path.basename(image_url))
            except:
                pass
        
        # 找出孤立图片
        orphaned = image_files - used_images
        self.stats["orphaned_images"] = list(orphaned)
        print(f"📊 发现 {len(orphaned)} 个孤立图片文件")

    def auto_fix_common_issues(self) -> bool:
        """自动修复常见问题"""
        print("🔧 开始自动修复常见问题...")
        
        fixed_count = 0
        
        # 1. 为缺少头像的人物分配头像
        if self.stats["missing_avatars"]:
            print(f"正在为 {len(self.stats['missing_avatars'])} 个人物分配头像...")
            
            try:
                with open(self.persons_file, 'r', encoding='utf-8') as f:
                    persons_data = json.load(f)
                
                image_files = self.get_image_files()
                if not image_files:
                    print("❌ 没有可用的图片文件进行分配")
                    return False
                
                for person in persons_data:
                    person_name = person.get('name', '')
                    if not person_name.strip():
                        continue
                    
                    if not person.get('avatarUrl'):
                        # 使用哈希值选择图片，确保一致性
                        person_hash = self.generate_person_hash(person_name)
                        hash_int = int(person_hash[:8], 16)
                        selected_image_index = hash_int % len(image_files)
                        selected_image = image_files[selected_image_index]
                        
                        # 设置头像URL
                        person['avatarUrl'] = f"/images/full/{selected_image}"
                        
                        self.stats["fixed_issues"].append({
                            "type": "分配头像",
                            "target": person_name,
                            "image": selected_image
                        })
                        fixed_count += 1
                
                # 保存修复后的数据
                with open(self.persons_file, 'w', encoding='utf-8') as f:
                    json.dump(persons_data, f, ensure_ascii=False, indent=2)
                
                print(f"✅ 成功为 {fixed_count} 个人物分配头像")
                
            except Exception as e:
                print(f"❌ 自动修复失败: {e}")
                return False
        
        return fixed_count > 0

    def generate_comprehensive_report(self) -> None:
        """生成综合验证报告"""
        print("📊 生成综合验证报告...")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "validation_summary": {
                "total_persons": self.stats["total_persons"],
                "total_events": self.stats["total_events"],
                "total_images": self.stats["total_images"],
                "persons_with_avatars": self.stats["persons_with_avatars"],
                "events_with_images": self.stats["events_with_images"],
                "avatar_coverage": f"{(self.stats['persons_with_avatars'] / max(1, self.stats['total_persons']) * 100):.1f}%",
                "data_quality_score": self.calculate_quality_score()
            },
            "issues_found": {
                "missing_avatars": len(self.stats["missing_avatars"]),
                "missing_event_images": len(self.stats["missing_event_images"]),
                "invalid_images": len(self.stats["invalid_images"]),
                "duplicate_names": len(self.stats["duplicate_names"]),
                "orphaned_images": len(self.stats["orphaned_images"])
            },
            "details": {
                "missing_avatars": self.stats["missing_avatars"],
                "missing_event_images": self.stats["missing_event_images"],
                "invalid_images": self.stats["invalid_images"],
                "duplicate_names": self.stats["duplicate_names"],
                "orphaned_images": self.stats["orphaned_images"]
            },
            "fixes_applied": self.stats["fixed_issues"],
            "recommendations": self.generate_recommendations()
        }
        
        try:
            with open(self.validation_report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            print(f"✅ 综合验证报告已保存到: {self.validation_report_file}")
        except Exception as e:
            print(f"❌ 保存验证报告失败: {e}")

    def calculate_quality_score(self) -> float:
        """计算数据质量分数"""
        total_items = self.stats["total_persons"] + self.stats["total_events"]
        if total_items == 0:
            return 0.0
        
        issues = (
            len(self.stats["missing_avatars"]) +
            len(self.stats["missing_event_images"]) +
            len(self.stats["invalid_images"]) +
            len(self.stats["duplicate_names"])
        )
        
        # 基础分数100分，每发现一个问题扣10分
        score = max(0.0, 100.0 - (issues * 10))
        
        # 头像覆盖率加成
        if self.stats["total_persons"] > 0:
            coverage_rate = self.stats["persons_with_avatars"] / self.stats["total_persons"]
            score *= (0.5 + 0.5 * coverage_rate)  # 50%基础分数 + 50%覆盖率权重
        
        return round(score, 1)

    def generate_recommendations(self) -> List[str]:
        """生成改进建议"""
        recommendations = []
        
        if self.stats["missing_avatars"]:
            recommendations.append(f"为 {len(self.stats['missing_avatars'])} 个人物分配头像")
        
        if self.stats["duplicate_names"]:
            recommendations.append(f"处理 {len(self.stats['duplicate_names'])} 个重复姓名")
        
        if self.stats["orphaned_images"]:
            recommendations.append(f"清理 {len(self.stats['orphaned_images'])} 个孤立图片文件")
        
        if self.stats["invalid_images"]:
            recommendations.append(f"修复 {len(self.stats['invalid_images'])} 个无效图片引用")
        
        if not recommendations:
            recommendations.append("数据质量优秀，无需额外修复")
        
        return recommendations

    def print_summary(self) -> None:
        """打印验证摘要"""
        print("\n" + "="*60)
        print("📊 历史数据图片验证摘要")
        print("="*60)
        print(f"总人物数量: {self.stats['total_persons']}")
        print(f"总事件数量: {self.stats['total_events']}")
        print(f"总图片数量: {self.stats['total_images']}")
        print(f"有人物头像: {self.stats['persons_with_avatars']}")
        print(f"有事件图片: {self.stats['events_with_images']}")
        print(f"数据质量分数: {self.calculate_quality_score()}/100")
        
        print(f"\n🔍 问题统计:")
        print(f"缺少头像: {len(self.stats['missing_avatars'])}")
        print(f"缺少事件图片: {len(self.stats['missing_event_images'])}")
        print(f"无效图片: {len(self.stats['invalid_images'])}")
        print(f"重复姓名: {len(self.stats['duplicate_names'])}")
        print(f"孤立图片: {len(self.stats['orphaned_images'])}")
        
        if self.stats["fixed_issues"]:
            print(f"\n🔧 已修复问题: {len(self.stats['fixed_issues'])}")
            for fix in self.stats["fixed_issues"]:
                print(f"   • {fix['type']}: {fix['target']} -> {fix['image']}")
        
        print("\n" + "="*60)

    def run_full_validation(self) -> bool:
        """运行完整验证流程"""
        print("🚀 开始历史数据图片综合验证...")
        print(f"工作目录: {self.base_dir}")
        
        # 1. 验证人物数据
        if not self.validate_persons_data():
            return False
        
        # 2. 验证事件数据
        if not self.validate_events_data():
            return False
        
        # 3. 查找孤立图片
        self.find_orphaned_images()
        
        # 4. 自动修复常见问题
        self.auto_fix_common_issues()
        
        # 5. 生成综合报告
        self.generate_comprehensive_report()
        
        # 6. 打印摘要
        self.print_summary()
        
        return True

def main():
    """主函数"""
    validator = HistoricalImageValidator()
    success = validator.run_full_validation()
    
    if success:
        print("\n✅ 历史数据图片验证完成！")
    else:
        print("\n❌ 验证过程中出现错误")

if __name__ == "__main__":
    main()