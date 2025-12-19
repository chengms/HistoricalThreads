import requests
from bs4 import BeautifulSoup

# 获取百度百科孔子页面
url = "https://baike.baidu.com/item/孔子"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.baidu.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0"
}

print(f"正在获取页面: {url}")
response = requests.get(url, headers=headers)
response.encoding = "utf-8"

if response.status_code != 200:
    print(f"获取页面失败，状态码: {response.status_code}")
    exit()

# 保存响应内容以便检查
with open("baidu_baike.html", "w", encoding="utf-8") as f:
    f.write(response.text)

# 解析HTML
soup = BeautifulSoup(response.text, "html.parser")

# 查找所有图片标签
images = soup.find_all("img")
print(f"\n找到 {len(images)} 张图片")

# 打印所有图片URL（包括空的）
print("\n=== 所有图片URL ===")
for i, img in enumerate(images[:20]):  # 只打印前20张
    src = img.get("src", "")
    data_src = img.get("data-src", "")
    img_url = src if src else data_src
    print(f"图片 {i+1}:")
    print(f"  src: {src}")
    print(f"  data-src: {data_src}")
    # 打印图片的父级元素，了解图片的位置
    print(f"  父级: {img.parent.name}")
    if img.parent.get("class"):
        print(f"  父级class: {img.parent.get('class')}")
    if img.parent.get("id"):
        print(f"  父级id: {img.parent.get('id')}")

# 尝试查找概述部分
print("\n=== 查找概述部分 ===")
# 查找所有可能的概述部分
possible_summary_classes = ["lemma-summary", "summary", "abstract"]
for class_name in possible_summary_classes:
    summary = soup.find("div", class_=class_name)
    if summary:
        print(f"找到 {class_name} 类的概述部分")
        # 检查是否有图片
        imgs = summary.find_all("img")
        print(f"  包含 {len(imgs)} 张图片")
        for img in imgs:
            print(f"  图片: src={img.get('src')}, data-src={img.get('data-src')}")

# 尝试查找信息框
print("\n=== 查找信息框 ===")
possible_info_classes = ["basic-info", "infobox", "lemmaWgt-lemmaInfo"]
for class_name in possible_info_classes:
    info_box = soup.find("div", class_=class_name)
    if info_box:
        print(f"找到 {class_name} 类的信息框")
        # 检查是否有图片
        imgs = info_box.find_all("img")
        print(f"  包含 {len(imgs)} 张图片")
        for img in imgs:
            print(f"  图片: src={img.get('src')}, data-src={img.get('data-src')}")

# 尝试查找包含 "image" 或 "img" 的所有元素
print("\n=== 查找包含图片的元素 ===")
img_containers = soup.find_all("div", class_=lambda x: x and ("image" in x.lower() or "img" in x.lower()))
for container in img_containers[:5]:
    print(f"容器: class={container.get('class')}")
    imgs = container.find_all("img")
    for img in imgs:
        print(f"  图片: src={img.get('src')}, data-src={img.get('data-src')}")

# 尝试查找所有data-src属性的图片（懒加载）
print("\n=== 查找懒加载图片 ===")
lazy_imgs = soup.find_all("img", attrs={"data-src": True})
print(f"找到 {len(lazy_imgs)} 张懒加载图片")
for img in lazy_imgs[:10]:
    print(f"  {img.get('data-src')}")

# 打印页面标题，确认是否获取到正确页面
print("\n=== 页面信息 ===")
title = soup.find("title")
if title:
    print(f"页面标题: {title.text}")

