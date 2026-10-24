import type { TagCategory } from '../types';
import { generalTaxonomyRules, generalTaxonomyTree } from './generalTaxonomy';

export type TaxonomyNode = { id: string; label: string; children?: TaxonomyNode[] };
const leaf = (id: string, label: string): TaxonomyNode => ({ id, label });
const group = (id: string, label: string, children: TaxonomyNode[]): TaxonomyNode => ({ id, label, children });
const other = leaf('other', '其他 / 待细分');

export const taxonomyTrees: Partial<Record<TagCategory, TaxonomyNode[]>> = {
  copyright: [leaf('games', '游戏'), leaf('anime', '动画'), leaf('manga', '漫画'), leaf('novels', '小说'), leaf('virtual', '虚拟主播 / 歌手'), leaf('music', '音乐 / 歌曲'), leaf('live', '真人影视'), leaf('original', '原创'), other],
  clothing: [
    group('upper', '上半身', [leaf('hats', '帽子 / 头饰'), leaf('tops', '上衣'), leaf('outerwear', '外套 / 披风'), leaf('aprons', '围裙')]),
    group('lower', '下半身', [leaf('pants', '裤子'), leaf('skirts', '裙子'), leaf('socks', '袜子 / 腿部'), leaf('shoes', '鞋履')]),
    group('fullbody', '连体 / 套装', [leaf('dresses', '连衣裙'), leaf('uniforms', '制服 / 西装'), leaf('traditional', '传统服饰'), leaf('armor', '盔甲'), leaf('bodysuits', '连体衣 / 泳装'), leaf('underwear', '内衣 / 贴身衣物'), leaf('costumes', '换装 / 主题服饰')]),
    group('accessories', '配饰', [leaf('neck', '领带 / 围巾'), leaf('hands', '手套'), leaf('waist', '腰带 / 腰饰'), leaf('ribbons', '丝带 / 蝴蝶结')]),
    group('details', '服装属性', [leaf('color', '颜色'), leaf('material', '材质'), leaf('pattern', '纹样'), leaf('construction', '领口 / 袖型'), leaf('state', '穿着状态 / 衣物变化')]), other,
  ],
  hair: [leaf('color', '发色'), leaf('length', '长度'), group('shape', '发型', [leaf('curly', '卷发 / 波浪'), leaf('braids', '辫子'), leaf('tails', '马尾 / 双马尾'), leaf('buns', '发髻'), leaf('loose', '直发 / 披发 / 造型'), leaf('fantasy', '幻想 / 特殊发型')]), leaf('bangs', '刘海 / 鬓发 / 呆毛'), leaf('ornaments', '发饰'), leaf('actions', '整理 / 触碰头发'), leaf('condition', '飘动 / 湿发 / 状态'), leaf('bodyhair', '胡须 / 体毛'), leaf('care', '护发用品'), other],
  eyes: [leaf('color', '瞳色'), leaf('state', '睁闭 / 遮挡 / 眼神'), leaf('shape', '眼型 / 瞳孔'), leaf('details', '眼周 / 眉毛 / 睫毛'), leaf('effects', '发光 / 眼部特效'), leaf('number', '数量 / 非人眼'), leaf('accessories', '眼罩 / 眼部物件'), leaf('actions', '视线 / 眼部动作'), other],
  expression: [leaf('happy', '微笑 / 开心'), leaf('sad', '悲伤 / 哭泣'), leaf('angry', '生气 / 不满'), leaf('shy', '害羞 / 脸红'), leaf('surprise', '惊讶 / 恐惧'), leaf('calm', '平静 / 困倦'), leaf('playful', '俏皮 / 吐舌 / 眨眼'), leaf('charts', '表情表 / 表情练习'), other],
  pose: [leaf('body', '站坐 / 身体姿态'), leaf('motion', '移动 / 动作'), leaf('hands', '手臂 / 手势'), leaf('gaze', '视线 / 朝向'), leaf('interaction', '互动 / 持物'), other],
  character: [leaf('count', '人物数量'), leaf('identity', '身份 / 种族'), other],
  scene: [leaf('nature', '自然景观'), leaf('city', '城市 / 建筑'), leaf('indoor', '室内空间'), leaf('weather', '天气 / 时间'), leaf('background', '背景 / 构图'), other],
  lighting: [leaf('natural', '自然光'), leaf('direction', '光照方向'), leaf('effects', '光影效果'), leaf('artificial', '灯具 / 人工光源'), other],
  style: [leaf('medium', '绘画媒介'), leaf('color', '色彩表现'), leaf('render', '渲染 / 画法'), leaf('practice', '创作过程 / 绘画挑战'), leaf('tools', '绘画工具 / 载体'), other],
  general: generalTaxonomyTree,
  meta: [leaf('quality', '质量 / 分辨率'), leaf('format', '媒介 / 格式'), leaf('notes', '标注 / 请求'), leaf('origin', '来源 / 发布 / 委托'), leaf('editing', '版本 / 编辑 / 差分'), leaf('audio', '声音 / 附加内容'), other],
};

export type TaxonomyRule = { path: string[]; pattern: RegExp; exclude?: RegExp };
const words = (path: string, alternatives: string): TaxonomyRule => ({ path: path.split('/'), pattern: new RegExp(`(?:^|_)(?:${alternatives})(?:_|$)`) });
const COLORS = 'black|white|red|blue|green|yellow|purple|pink|brown|blonde|blond|grey|gray|silver|gold|orange|aqua|multicolored|rainbow|two-tone';

export const taxonomyRules: Partial<Record<TagCategory, TaxonomyRule[]>> = {
  clothing: [
    words('upper/hats', 'hat|hats|cap|caps|beret|bonnet|hood|headwear|headband|headdress|helmet|crown|tiara'),
    words('upper/tops', 'shirt|shirts|t-shirt|tshirt|blouse|blouses|sweater|cardigan|hoodie|vest|tank_top|crop_top|bandeau'),
    words('upper/outerwear', 'coat|coats|jacket|blazer|cape|cloak|poncho|parka'),
    words('lower/pants', 'pants|trousers|jeans|shorts|bloomers|leggings|culottes'), words('lower/skirts', 'skirt|skirts|skort'),
    words('lower/socks', 'socks|sock|stockings|pantyhose|tights|thighhighs|kneehighs|legwear|leg_warmers|garter'),
    words('lower/shoes', 'shoe|shoes|boots|boot|sandals|sneakers|heels|loafers|slippers|footwear'),
    words('fullbody/dresses', 'dress|dresses|gown'), words('fullbody/uniforms', 'uniform|uniforms|suit|suits|tuxedo|tracksuit'),
    words('fullbody/traditional', 'kimono|yukata|hakama|hanfu|cheongsam|qipao|sari|hanbok'), words('fullbody/armor', 'armor|armour|breastplate|pauldron'),
    words('fullbody/bodysuits', 'bodysuit|leotard|swimsuit|bikini|overalls|jumpsuit|pajamas'),
    words('accessories/neck', 'necktie|bowtie|tie|scarf|choker|necklace'), words('accessories/hands', 'glove|gloves|mittens|gauntlets'), words('accessories/waist', 'belt|obi|waistband'),
    words('details/color', COLORS), words('details/material', 'leather|latex|silk|satin|denim|lace|wool|knit|knitted|fur|velvet|sheer|transparent|rubber|metal'),
    words('details/pattern', 'striped|stripes|plaid|checkered|polka_dot|floral|camouflage|patterned|print'),
    words('details/construction', 'collar|collared|neckline|sleeve|sleeves|sleeveless|frills|ruffles|button|buttons|zipper|pocket|pockets|cutout'),
  ],
  hair: [words('color', COLORS), words('length', 'long|short|medium|very_long|absurdly_long|bald'), words('shape/curly', 'curly|wavy|ringlets|drill_hair'), words('shape/braids', 'braid|braids|braided'), words('shape/tails', 'ponytail|ponytails|twintails|pigtails|sidetail'), words('shape/buns', 'bun|buns|hairbun|hairbuns'), words('bangs', 'bangs|sidelocks|ahoge'), words('ornaments', 'ornament|ornaments|ribbon|ribbons|hairclip|hairpin|hairband|scrunchie|hair_bow|hair_flower')],
  eyes: [words('color', `${COLORS}|heterochromia`), words('state', 'closed|half-closed|open|wink|winking'), words('shape', 'pupil|pupils|iris|irises|tsurime|tareme|slit|round|heart|star'), words('details', 'eyebrow|eyebrows|eyelash|eyelashes')],
  expression: [words('happy', 'smile|smiling|grin|grinning|laughing|happy|smirk|smirking'), words('sad', 'sad|crying|tears|sobbing|depressed|frown|frowning'), words('angry', 'angry|anger|pout|pouting|annoyed|disgust'), words('shy', 'blush|blushing|embarrassed|embarrassment|shy|nervous'), words('surprise', 'surprised|surprise|scared|fear|shocked'), words('calm', 'serious|expressionless|sleepy|bored|neutral')],
  pose: [words('body', 'standing|sitting|lying|kneeling|crouching|squatting|leaning|stretching'), words('motion', 'walking|running|jumping|dancing|flying|floating|swimming'), words('hands', 'hand|hands|arm|arms|waving|pointing|crossed|outstretched'), words('gaze', 'looking|facing|back|profile'), words('interaction', 'holding|hugging|carrying|reaching|touching|embrace')],
  character: [words('count', '\\d+(?:girls?|boys?|others?)|solo|multiple|two_people|group'), words('identity', 'elf|fairy|robot|android|demon|angel|vampire|human|original')],
  scene: [words('nature', 'forest|woods|tree|trees|mountain|mountains|ocean|sea|beach|river|lake|waterfall|garden|park|field|flowers|underwater|space'), words('city', 'city|cityscape|street|building|buildings|bridge|castle|temple|shrine|town|urban'), words('indoor', 'indoors|indoor|room|bedroom|classroom|library|kitchen|bathroom|office'), words('weather', 'sky|cloud|clouds|rain|snow|sunset|sunrise|night|day|storm|fog'), words('background', 'background|scenery|landscape|perspective')],
  lighting: [words('natural', 'sunlight|moonlight|sunbeam|sunbeams|golden_hour|sunset|sunrise'), words('direction', 'backlighting|backlit|rim|frontlighting|sidelighting|spotlight'), words('effects', 'soft|shadow|shadows|glowing|glow|lens_flare|god_rays|volumetric|dappled')],
  style: [words('medium', 'watercolor|watercolour|sketch|pencil|painting|ink|traditional|digital|oil|pastel'), words('color', 'monochrome|greyscale|grayscale|flat_color|limited_palette'), words('render', 'lineart|line_art|pixel_art|realistic|photorealistic|anime|cel_shading|screentones|chibi|3d|2d')],
  general: generalTaxonomyRules,
  meta: [words('quality', 'quality|highres|lowres|absurdres|resolution|upscaled'), words('format', 'animated|animation|gif|video|comic|4koma|traditional_media|digital_media|photo'), words('notes', 'request|commentary|translation|translated|source|check|error|duplicate|mismatch')],
};
