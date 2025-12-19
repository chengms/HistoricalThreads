import requests
from bs4 import BeautifulSoup
import json

# 设置请求头，模拟真实浏览器
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.baidu.com/s?wd=%E5%AD%94%E5%AD%90',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-User': '?1',
    'DNT': '1',
    'X-Requested-With': 'XMLHttpRequest'
}

# 获取百度百科页面
def get_baidu_baike_page(title):
    url = f'https://baike.baidu.com/item/{title}'
    print(f'正在获取页面: {url}')
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        
        if response.status_code == 200:
            return response.text
        else:
            print(f'请求失败，状态码: {response.status_code}')
            return None
    except Exception as e:
        print(f'获取页面失败: {str(e)}')
        return None

# 分析页面图片结构
def analyze_images(html_content):
    if not html_content:
        return
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    print('\n=== 页面图片分析 ===')
    
    # 1. 查找所有img标签
    all_imgs = soup.find_all('img')
    print(f'\n1. 页面中共有 {len(all_imgs)} 个img标签')
    
    # 2. 提取所有图片URL（src和data-src）
    img_urls = []
    for img in all_imgs:
        src = img.get('src', '')
        data_src = img.get('data-src', '')
        data_original = img.get('data-original', '')
        
        urls = [url for url in [src, data_src, data_original] if url]
        if urls:
            img_urls.extend(urls)
    
    print(f'\n2. 提取到的图片URL总数: {len(img_urls)}')
    
    # 3. 打印前20个图片URL
    print('\n3. 部分图片URL示例:')
    for i, url in enumerate(img_urls[:20]):
        print(f'   {i+1}. {url}')
    
    # 4. 查找概述部分的图片
    print('\n4. 概述部分的图片:')
    summary_sections = soup.find_all(['div'], class_=lambda x: x and ('summary' in x.lower() or 'lemma-summary' in x.lower()))
    
    for i, section in enumerate(summary_sections):
        section_imgs = section.find_all('img')
        print(f'   概述部分 {i+1} 有 {len(section_imgs)} 张图片')
        for img in section_imgs:
            src = img.get('src', '')
            data_src = img.get('data-src', '')
            data_original = img.get('data-original', '')
            print(f'      - src: {src}')
            print(f'      - data-src: {data_src}')
            print(f'      - data-original: {data_original}')
    
    # 5. 查找信息框中的图片
    print('\n5. 信息框中的图片:')
    info_boxes = soup.find_all(['div', 'table'], class_=lambda x: x and ('basic-info' in x.lower() or 'infobox' in x.lower() or 'basicInfo' in x))
    
    for i, info_box in enumerate(info_boxes):
        box_imgs = info_box.find_all('img')
        print(f'   信息框 {i+1} 有 {len(box_imgs)} 张图片')
        for img in box_imgs:
            src = img.get('src', '')
            data_src = img.get('data-src', '')
            data_original = img.get('data-original', '')
            print(f'      - src: {src}')
            print(f'      - data-src: {data_src}')
            print(f'      - data-original: {data_original}')
    
    # 6. 查找所有div中的图片
    print('\n6. 所有div标签中的图片:')
    divs_with_images = soup.find_all('div')
    div_imgs = []
    
    for div in divs_with_images:
        imgs = div.find_all('img')
        div_imgs.extend(imgs)
    
    print(f'   所有div中共有 {len(div_imgs)} 张图片')
    
    # 7. 查找可能的主要图片
    print('\n7. 可能的主要图片:')
    possible_main_images = []
    
    # 查找带有特定类名的图片容器
    main_image_containers = soup.find_all(['div', 'span'], class_=lambda x: x and ('main-img' in x.lower() or 'mainimage' in x.lower() or 'picture' in x.lower()))
    
    for container in main_image_containers:
        imgs = container.find_all('img')
        possible_main_images.extend(imgs)
    
    # 查找宽高比较大的图片
    for img in all_imgs:
        width = img.get('width', '')
        height = img.get('height', '')
        if width and height:
            try:
                w = int(width)
                h = int(height)
                if w > 100 and h > 100:  # 尺寸较大的图片
                    possible_main_images.append(img)
            except:
                pass
    
    # 去重
    unique_main_images = []
    seen_srcs = set()
    for img in possible_main_images:
        src = img.get('src', '') or img.get('data-src', '') or img.get('data-original', '')
        if src and src not in seen_srcs:
            seen_srcs.add(src)
            unique_main_images.append(img)
    
    print(f'   可能的主要图片有 {len(unique_main_images)} 张')
    for img in unique_main_images[:10]:
        src = img.get('src', '')
        data_src = img.get('data-src', '')
        data_original = img.get('data-original', '')
        width = img.get('width', '')
        height = img.get('height', '')
        print(f'      - 尺寸: {width}x{height}')
        print(f'        src: {src}')
        print(f'        data-src: {data_src}')
        print(f'        data-original: {data_original}')

# 主函数
def main():
    title = '孔子'
    html_content = get_baidu_baike_page(title)
    
    if html_content:
        # 保存HTML到文件（用于调试）
        with open('baidu_baike_debug.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        print('\nHTML内容已保存到 baidu_baike_debug.html')
        
        # 分析图片
        analyze_images(html_content)

if __name__ == '__main__':
    main()
