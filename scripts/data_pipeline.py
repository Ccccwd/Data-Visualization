"""
Data Pipeline: Extract structured data from 黄宾虹年谱 Excel
Outputs binhong_data.json for the frontend visualization.
"""

import re
import json
import sys
import io
from collections import defaultdict

import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

INPUT_FILE = r"D:\code\数据可视化\Data Visualization\黄宾虹年谱_精密结构化清洗.xlsx"
OUTPUT_FILE = r"D:\code\数据可视化\Data Visualization\binhong-visualization\src\data\binhong_data.json"

# ── Geocoding Dictionary ──────────────────────────────────────────

GEOCODE_DICT: dict[str, list[float]] = {
    "上海": [31.23, 121.47], "上海縣": [31.23, 121.47], "滬": [31.23, 121.47], "滬濱": [31.23, 121.47],
    "杭州": [30.27, 120.15], "杭州灣": [30.35, 120.20], "西泠": [30.25, 120.15],
    "南京": [32.06, 118.80], "南京路": [31.23, 121.47],
    "北京": [39.90, 116.40], "北平": [39.90, 116.40],
    "成都": [30.57, 104.07],
    "重慶": [29.56, 106.55],
    "桂林": [25.27, 110.29],
    "陽朔": [24.78, 110.18], "阳朔": [24.78, 110.18],
    "漓江": [25.00, 110.30], "灕江": [25.00, 110.30],
    "峨眉": [29.60, 103.33], "峨嵋": [29.60, 103.33], "大峨山": [29.60, 103.33],
    "嘉定": [29.55, 103.77], "樂山": [29.55, 103.77],
    "巫山": [31.07, 109.88],
    "黃山": [30.13, 118.17], "黄山": [30.13, 118.17],
    "金華": [29.08, 119.65], "金华": [29.08, 119.65],
    "歙縣": [29.86, 118.44], "歙": [29.86, 118.44],
    "廣州": [23.13, 113.26],
    "武漢": [30.59, 114.31], "漢口": [30.59, 114.31], "漢陽": [30.55, 114.22],
    "宜昌": [30.69, 111.28],
    "萬縣": [30.81, 108.41], "万县": [30.81, 108.41],
    "夾江": [29.74, 103.57], "夹江": [29.74, 103.57],
    "瞿塘峽": [31.04, 109.55],
    "青城": [30.90, 103.57], "青城山": [30.90, 103.57],
    "梧州": [23.48, 111.28],
    "桂林": [25.27, 110.29],
    "潭渡": [29.88, 118.40], "潭渡村": [29.88, 118.40],
    "徽州": [29.86, 118.34],
    "新安": [29.68, 118.53],
    "揚州": [32.39, 119.42],
    "蘇州": [31.30, 120.62],
    "無錫": [31.49, 120.31], "錫山": [31.56, 120.38],
    "南昌": [28.68, 115.86],
    "長沙": [28.23, 112.94],
    "昆明": [25.04, 102.71],
    "貴陽": [26.65, 106.63],
    "桂林": [25.27, 110.29],
    "蓋山": [25.30, 110.35],
    "臨海": [28.85, 121.15],
    "紹興": [30.00, 120.58], "山陰": [30.00, 120.58],
    "寧波": [29.87, 121.55],
    "溫州": [28.00, 120.67],
    "福州": [26.07, 119.30],
    "廈門": [24.48, 118.09],
    "西安": [34.26, 108.94],
    "洛陽": [34.62, 112.45],
    "開封": [34.80, 114.35],
    "天津": [39.13, 117.20],
    "青島": [36.07, 120.38],
    "大連": [38.91, 121.60],
    "香港": [22.32, 114.17],
    "澳門": [22.20, 113.54],
    "東京": [35.68, 139.69],
    "京都": [35.01, 135.77],
    "大阪": [34.69, 135.50],
    "三峽": [31.04, 110.00],
    "白岳": [29.90, 118.20],
    "富春江": [29.90, 119.70],
    "桐廬": [29.79, 119.69],
    "嚴州": [29.48, 119.28],
    "九江": [29.71, 116.00],
    "廬山": [29.56, 115.99],
}

# ── Ganzhi (天干地支) Mapping ─────────────────────────────────────

TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

def year_to_ganzhi(year: int) -> str:
    idx = (year - 4) % 60
    gan_idx = idx % 10
    zhi_idx = idx % 12
    return TIAN_GAN[gan_idx] + DI_ZHI[zhi_idx]

def ganzhi_to_year(ganzhi: str) -> list[int]:
    """Return possible years (within 1860-1960) for a given ganzhi."""
    if len(ganzhi) != 2:
        return []
    gan = ganzhi[0]
    zhi = ganzhi[1]
    if gan not in TIAN_GAN or zhi not in DI_ZHI:
        return []
    gan_idx = TIAN_GAN.index(gan)
    zhi_idx = DI_ZHI.index(zhi)
    # Find the cycle offset
    for k in range(60):
        if k % 10 == gan_idx and k % 12 == zhi_idx:
            # Base year for cycle: year = 4 + k + 60*n
            results = []
            for n in range(-1, 4):
                year = 4 + k + 60 * n
                if 1860 <= year <= 1960:
                    results.append(year)
            return results
    return []

# ── Year Extraction ──────────────────────────────────────────────

def extract_years_from_text(text: str) -> list[tuple[int, str]]:
    """Extract (year, context) pairs from text."""
    results = []

    # Pattern 1: Direct year mention "YYYY年"
    for m in re.finditer(r'(\d{4})年', text):
        year = int(m.group(1))
        if 1860 <= year <= 1960:
            results.append((year, m.group(0)))

    # Pattern 2: Ganzhi year "己丑（1949年）" - already captured above
    # Pattern 3: Ganzhi alone followed by context
    for m in re.finditer(r'([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s*[（(]?\s*(?:公元)?(\d{4})\s*年?\s*[）)]?', text):
        year = int(m.group(2))
        if 1860 <= year <= 1960:
            results.append((year, m.group(0)))

    # Pattern 4: Age reference "X歲" / "X岁" with birth year 1865
    for m in re.finditer(r'[（(]?\s*(八十|九十|七十|六十|五十|四十|三十|二十)\s*[一二三四五六七八九]?十?\s*[歲岁]', text):
        age_text = m.group(1)
        age_map = {"二十": 20, "三十": 30, "四十": 40, "五十": 50, "六十": 60, "七十": 70, "八十": 80, "九十": 90}
        if age_text in age_map:
            approx_year = 1865 + age_map[age_text]
            if 1860 <= approx_year <= 1960:
                results.append((approx_year, m.group(0)))

    # Pattern 5: Reign years - 光緒/光緒 N年
    for m in re.finditer(r'光[緒绪]\s*(\d{1,2})\s*年', text):
        n = int(m.group(1))
        year = 1875 + n - 1
        if 1875 <= year <= 1908:
            results.append((year, m.group(0)))

    # Pattern 6: 民國/民國 N年
    for m in re.finditer(r'民[國国]\s*(\d{1,2})\s*年', text):
        n = int(m.group(1))
        year = 1912 + n - 1
        if 1912 <= year <= 1955:
            results.append((year, m.group(0)))

    return results

# ── Person Extraction ────────────────────────────────────────────

# Known person names seed dictionary (built from manual review of the data)
SEED_PEOPLE = [
    "黄宾虹", "邓实", "黄节", "张宗祥", "雁迅", "胡韫玉", "田寄南", "陈定谟", "杨元生",
    "钟毓龙", "徐元白", "余绍宋", "吴一峰", "许承尧", "汪德渊", "冯超然", "王中秀",
    "曹意强", "朱启钤", "张大千", "黄仲方", "黄樸存", "居素吾", "王济远", "萧蜕",
    "叶恭绰", "张大千", "刘海粟", "徐悲鸿", "齐白石", "潘天寿", "傅抱石", "李可染",
    "林风眠", "吴冠中", "陆俨少", "谢稚柳", "陈师曾", "金城", "溥儒", "陈半丁",
    "于右任", "沈尹默", "林散之", "沙孟海", "启功", "赵朴初", "郭沫若", "郑孝胥",
    "康有为", "梁启超", "蔡元培", "鲁迅", "胡适", "陈独秀", "李大钊", "章太炎",
    "黄炎培", "马叙伦", "沈钧儒", "张謇", "周作人", "郁达夫", "茅盾", "巴金",
    "郑振铎", "阿英", "夏衍", "田汉", "欧阳予倩", "洪深", "曹禺", "老舍",
]

# Prefixes/suffixes that indicate the match is NOT a person name
PERSON_BLACKLIST = re.compile(
    r'^[其为将于以与由从在向到被把让给用按因对于及和或但如若则可要能会得]'  # Single char function words as prefix
    r'|^[“”「『]''""'  # Quote marks
    r'|追隨' r'|^在'
)

def extract_people_from_text(text: str) -> list[str]:
    """Extract person names from text."""
    people = set()

    # Pattern 1: Name(YYYY-YYYY) birth-death format
    for m in re.finditer(r'([一-鿿]{2,4})[（(]\s*(\d{3,4})\s*[-–—]\s*(\d{3,4})\s*[）)]', text):
        name = m.group(1).strip()
        birth = int(m.group(2))
        death = int(m.group(3))
        # Validate: birth < death, both in reasonable range, and name is 2-4 Chinese chars
        if (1800 <= birth <= 1920 and 1850 <= death <= 2000 and birth < death
                and 2 <= len(name) <= 4 and not PERSON_BLACKLIST.match(name)):
            people.add(name)

    # Pattern 2: "XX先生" / "XX兄" only - require exactly 2 chars before the title
    for m in re.finditer(r'([一-鿿]{2})(?:先生|吾兄)', text):
        name = m.group(1).strip()
        if not PERSON_BLACKLIST.match(name):
            people.add(name)

    # Pattern 3: Match against seed dictionary
    for name in SEED_PEOPLE:
        if name in text:
            people.add(name)

    return list(people)

# ── Location Extraction ──────────────────────────────────────────

# Location groups: prefer longer/canonical name, merge shorter aliases
LOCATION_GROUPS: dict[str, list[str]] = {
    "上海": ["上海", "上海縣", "滬", "滬濱", "南京路"],  # 南京路 is a street in Shanghai
    "杭州": ["杭州", "杭州灣", "西泠"],
    "南京": ["南京"],
    "北京": ["北京", "北平"],
    "成都": ["成都"],
    "重庆": ["重慶"],
    "桂林": ["桂林"],
    "阳朔": ["陽朔", "阳朔"],
    "漓江": ["漓江", "灕江"],
    "峨眉": ["峨眉", "峨嵋", "大峨山"],
    "乐山": ["嘉定", "樂山"],
    "巫山": ["巫山"],
    "黄山": ["黃山", "黄山", "白岳"],
    "金华": ["金華", "金华"],
    "歙县": ["歙縣", "歙"],
    "广州": ["廣州"],
    "武汉": ["武漢", "漢口", "漢陽"],
    "宜昌": ["宜昌"],
    "万县": ["萬縣", "万县"],
    "夹江": ["夾江", "夹江"],
    "瞿塘峡": ["瞿塘峽"],
    "青城山": ["青城", "青城山"],
    "梧州": ["梧州"],
    "潭渡": ["潭渡", "潭渡村"],
    "徽州": ["徽州"],
    "新安江": ["新安"],
    "苏州": ["蘇州"],
    "无锡": ["無錫", "錫山"],
    "绍兴": ["紹興", "山陰"],
    "临海": ["臨海"],
    "宁波": ["寧波"],
    "三峡": ["三峽"],
}

# Build reverse lookup: alias -> canonical name
LOCATION_CANONICAL: dict[str, str] = {}
for canonical, aliases in LOCATION_GROUPS.items():
    for alias in aliases:
        LOCATION_CANONICAL[alias] = canonical

def extract_locations_from_text(text: str) -> list[dict]:
    """Extract locations from text and match to geocode dict, with dedup."""
    found_map: dict[str, str] = {}  # canonical name -> first matched alias

    # Sort aliases by length (longer first) to avoid partial matches
    all_aliases = sorted(LOCATION_CANONICAL.keys(), key=len, reverse=True)

    for alias in all_aliases:
        canonical = LOCATION_CANONICAL[alias]
        if canonical in found_map:
            continue  # Already found this group
        if alias in text:
            found_map[canonical] = alias

    results = []
    for canonical, matched_alias in found_map.items():
        # Use the canonical name for coords
        coords = GEOCODE_DICT.get(matched_alias) or GEOCODE_DICT.get(canonical)
        results.append({
            "name": canonical,
            "coords": coords,
        })

    return results

# ── Seal Extraction ──────────────────────────────────────────────

def extract_seals_from_text(text: str) -> list[dict]:
    """Extract seal stamps from text."""
    seals = []
    for m in re.finditer(r'鈐印[：:]\s*([^\n，。；]+)', text):
        seal_text = m.group(1).strip()
        # Split multiple seals (separated by 、or ，)
        for seal_name in re.split(r'[、，]', seal_text):
            seal_name = seal_name.strip()
            if seal_name:
                seals.append({
                    "name": seal_name,
                    "owner": "",  # Will be filled by context
                })
    return seals

# ── Main Pipeline ────────────────────────────────────────────────

def run_pipeline():
    print("Reading Excel file...")
    df = pd.read_excel(INPUT_FILE)
    print(f"Total rows: {len(df)}")

    col_time = df.columns[0]
    col_location = df.columns[1]
    col_text = df.columns[2]
    col_tag = df.columns[3]

    entries = []
    all_people_data = defaultdict(lambda: {"count": 0, "years": set(), "connections": defaultdict(int)})
    location_mention_counts = defaultdict(int)
    year_entry_counts = defaultdict(int)

    print("Processing rows...")

    for i, row in df.iterrows():
        text = str(row[col_text]) if pd.notna(row[col_text]) else ""
        if not text or text == "nan":
            continue

        # Extract year
        years_found = extract_years_from_text(text)
        year = None
        year_confidence = "low"
        ganzhi = ""

        if years_found:
            # Use the most common year found in this text
            year_counts = defaultdict(int)
            for y, _ in years_found:
                year_counts[y] += 1
            year = max(year_counts, key=year_counts.get)
            year_confidence = "high" if year_counts[year] >= 2 else "medium"
            ganzhi = year_to_ganzhi(year)

        # Fallback: check the column value
        if year is None:
            col_val = str(row[col_time])
            year_match = re.search(r'(\d{4})年', col_val)
            if year_match:
                year = int(year_match.group(1))
                year_confidence = "medium"
                ganzhi = year_to_ganzhi(year)

        if year is not None:
            year_entry_counts[year] += 1

        # Extract locations
        locations = extract_locations_from_text(text)
        primary_location = locations[0]["name"] if locations else None
        for loc in locations:
            location_mention_counts[loc["name"]] += 1

        # Extract people
        people = extract_people_from_text(text)

        # Build co-occurrence
        for j, p1 in enumerate(people):
            all_people_data[p1]["count"] += 1
            if year:
                all_people_data[p1]["years"].add(year)
            for p2 in people[j+1:]:
                all_people_data[p1]["connections"][p2] += 1
                all_people_data[p2]["connections"][p1] += 1

        # Extract seals
        seals = extract_seals_from_text(text)

        entry = {
            "id": i + 1,
            "rowIndex": i,
            "year": year,
            "yearConfidence": year_confidence,
            "ganzhi": ganzhi,
            "locations": locations,
            "primaryLocation": primary_location,
            "people": people,
            "text": text,
            "tags": [str(row[col_tag])] if pd.notna(row[col_tag]) else [],
            "seals": seals,
            "category": "artwork" if any(s in text for s in ["圖", "畫", "書", "題", "跋"]) else "biography",
        }
        entries.append(entry)

    # ── Post-processing: Fill years with interpolation ─────────

    # Fill gaps for entries without years using surrounding context
    last_year = None
    for entry in entries:
        if entry["year"] is not None:
            last_year = entry["year"]
        elif last_year is not None and entry["yearConfidence"] == "low":
            # Don't assign - leave as null
            pass

    # ── Build timeline data ──────────────────────────────────────

    timeline = []
    for year in sorted(year_entry_counts.keys()):
        age = year - 1865
        gz = year_to_ganzhi(year)
        label = f"{year} / {gz}"
        if 0 < age < 100:
            label += f"（{age}歲）"
        timeline.append({
            "year": year,
            "ganzhi": gz,
            "displayLabel": label,
            "entryCount": year_entry_counts[year],
        })

    # ── Build people data ────────────────────────────────────────

    people_output = {}
    for name, info in all_people_data.items():
        people_output[name] = {
            "count": info["count"],
            "years": sorted(list(info["years"])),
            "connections": dict(info["connections"]),
        }

    # ── Build geodata ────────────────────────────────────────────

    geodata_locations = []
    for name, count in sorted(location_mention_counts.items(), key=lambda x: -x[1]):
        # Use canonical name
        canonical = LOCATION_CANONICAL.get(name, name)
        # Skip duplicates (already have the canonical name)
        if any(gl["name"] == canonical for gl in geodata_locations):
            # Merge counts
            for gl in geodata_locations:
                if gl["name"] == canonical:
                    gl["mentionCount"] += count
                    break
            continue
        coords = GEOCODE_DICT.get(name)
        if coords:
            geodata_locations.append({
                "name": canonical,
                "coords": coords,
                "mentionCount": count,
            })

    # ── Assemble final output ────────────────────────────────────

    all_years = [e["year"] for e in entries if e["year"] is not None]
    output = {
        "metadata": {
            "subject": "黄宾虹",
            "birthYear": 1865,
            "deathYear": 1955,
            "totalEntries": len(entries),
            "yearRange": [min(all_years) if all_years else 1864, max(all_years) if all_years else 1955],
        },
        "timeline": timeline,
        "entries": entries,
        "people": people_output,
        "geodata": {
            "locations": geodata_locations[:30],  # Top 30
            "routes": [],
        },
    }

    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nPipeline complete!")
    print(f"  Entries: {len(entries)}")
    print(f"  Entries with years: {sum(1 for e in entries if e['year'] is not None)}")
    print(f"  Unique years: {len(timeline)}")
    print(f"  Unique people: {len(people_output)}")
    print(f"  Unique locations: {len(geodata_locations)}")
    print(f"  Timeline range: {output['metadata']['yearRange']}")
    print(f"\nOutput: {OUTPUT_FILE}")

if __name__ == "__main__":
    run_pipeline()
