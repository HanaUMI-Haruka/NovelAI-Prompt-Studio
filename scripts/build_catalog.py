"""Read an explicitly downloaded SQLite snapshot; never execute source code or contact a network.
Usage: python scripts/build_catalog.py .tools/catalog-source
"""
import hashlib
import json
import re
import sqlite3
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES = [
    ('character', r'^(?:\d+(?:girls?|boys?|others?)|solo|multiple_girls|multiple_boys|no_humans|elf|fairy|robot|original)$'),
    ('expression', r'(?:^|_)(?:smile|smiling|grin|grinning|blush|blushing|laughing|frown|frowning|angry|anger|crying|tears|surprised|surprise|scared|fear|embarrassed|embarrassment|expression|expressions|pout|pouting|smirk|smirking|sleepy|serious|nervous|disgust|disappointed|expressionless|wink|winking)(?:_|$)|^:?[dpo]$'),
    ('hair', r'(?:^|_)(?:hair|hairstyle|hairdo|ponytail|ponytails|twintails|braid|braids|bangs|ahoge|sidelocks|hairbun|hairbuns|bun|buns)(?:_|$)'),
    ('eyes', r'(?:^|_)(?:eye|eyes|pupil|pupils|iris|irises|eyebrow|eyebrows|eyelash|eyelashes|heterochromia)(?:_|$)'),
    ('clothing', r'(?:^|_)(?:clothes|clothing|outfit|outfits|costume|uniform|shirt|shirts|blouse|blouses|dress|dresses|skirt|skirts|shorts|pants|trousers|jeans|jacket|coat|coats|hoodie|sweater|cardigan|vest|suit|kimono|yukata|hakama|cheongsam|qipao|hanfu|armor|armour|boots|boot|shoe|shoes|sandals|sneakers|heels|socks|stockings|pantyhose|tights|hat|hats|cap|beret|bonnet|hood|cape|scarf|gloves|glove|mittens|necktie|bowtie|ribbon|ribbons|belt|sleeve|sleeves|sleeveless|collar|apron|headwear|headband|headdress|swimsuit|bikini|leotard|bodysuit|pajamas|underwear|bra|panties|lingerie)(?:_|$)'),
    ('pose', r'(?:^|_)(?:pose|posing|standing|sitting|lying|kneeling|crouching|squatting|walking|running|jumping|dancing|flying|floating|leaning|stretching|waving|hugging|pointing|holding|reaching|crossed|outstretched|arms_up|arm_up|hand_up|hands_up|looking_at_viewer|looking_back|looking_away|looking_up|looking_down|hands_on_hips|hand_on_hip)(?:_|$)'),
    ('lighting', r'(?:^|_)(?:lighting|light|backlighting|backlit|sunlight|moonlight|spotlight|sunbeam|sunbeams|god_rays|lens_flare|rim_light|golden_hour|shadow|shadows|glowing|glow)(?:_|$)'),
    ('scene', r'(?:^|_)(?:background|scenery|landscape|forest|woods|tree|trees|mountain|mountains|ocean|sea|beach|river|lake|waterfall|city|cityscape|street|sky|cloud|clouds|starry_sky|indoors|outdoors|room|bedroom|classroom|library|garden|park|field|flowers|building|buildings|bridge|rain|snow|sunset|sunrise|night|day|castle|temple|shrine|space|underwater)(?:_|$)'),
    ('style', r'(?:^|_)(?:watercolor|watercolour|sketch|sketches|drawing|painting|lineart|line_art|pixel_art|monochrome|greyscale|grayscale|realistic|photorealistic|anime_coloring|flat_color|cel_shading|oil_painting|traditional_media|digital_media|ink|screentones|chibi|3d|2d)(?:_|$)'),
]
COMPILED_RULES = [(category, re.compile(pattern)) for category, pattern in RULES]


def classify(name, source_category):
    native = {1: 'artist', 3: 'copyright', 4: 'named-character', 5: 'meta'}
    if source_category in native:
        return native[source_category]
    for category, pattern in COMPILED_RULES:
        if pattern.search(name):
            return category
    return 'general'


def main():
    source = Path(sys.argv[1]).resolve()
    database = source / 'tag.sqlite'
    metadata = json.loads((source / 'source.json').read_text(encoding='utf-8-sig'))
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as connection:
        rows = connection.execute('SELECT name, cn_name, category, post_count FROM tags ORDER BY post_count DESC, name ASC').fetchall()
    data = []
    skipped = 0
    seen = set()
    for name, zh, category, count in rows:
        if not isinstance(name, str) or not name.strip() or not isinstance(zh, str) or not zh.strip() or category not in (0, 1, 3, 4, 5) or name in seen:
            skipped += 1
            continue
        seen.add(name)
        data.append([name.strip(), zh.strip(), category, max(0, int(count or 0)), classify(name, category)])
    target = ROOT / 'public' / 'catalog'
    target.mkdir(parents=True, exist_ok=True)
    content = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    (target / 'danbooru-tags.json').write_bytes(content)
    manifest = {
        'schemaVersion': 1, **metadata,
        'sourceUrl': 'https://github.com/' + metadata['repository'],
        'license': 'MIT', 'translationMethod': '上游 Gemini 3 Flash 翻译及社区校对，非官方中文翻译，可能有误',
        'scope': '上游收录 post_count >= 10 的标签快照；非 Danbooru 实时全集',
        'classification': '角色、作品、画师、元标签沿用来源；通用细类按 scripts/build_catalog.py 规则整理，其他进入 general',
        'total': len(data), 'sourceTotal': len(rows), 'skipped': skipped,
        'categories': dict(Counter(row[4] for row in data)),
        'databaseSha256': hashlib.sha256(database.read_bytes()).hexdigest(),
        'catalogSha256': hashlib.sha256(content).hexdigest(),
        'bytes': len(content),
    }
    (target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    license_text = (source / 'LICENSE').read_text(encoding='utf-8')
    notice = f"Danbooru 中英文标签快照来源与许可\n\n来源：{manifest['sourceUrl']}\n固定提交：{metadata['commit']}\n获取时间（UTC）：{metadata['retrievedAt']}\n来源条数：{len(rows)}；本地导入：{len(data)}；跳过：{skipped}\n\n英文标签与原始类别来自上游 Danbooru 快照；中文由社区机器翻译和校对，不是 Danbooru 官方翻译，可能存在误译。通用细类由本工具规则整理，不代表 Danbooru 官方分类。未下载图片或 wiki 长文。无在线翻译或生图 API。\n\n以下保留上游 MIT 许可全文：\n\n{license_text}"
    (ROOT / 'THIRD_PARTY_NOTICES.txt').write_text(notice, encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
