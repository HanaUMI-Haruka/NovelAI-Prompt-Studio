import type { TaxonomyNode, TaxonomyRule } from './tagTaxonomy';

const leaf = (id: string, label: string): TaxonomyNode => ({ id, label });
const group = (id: string, label: string, children: TaxonomyNode[]): TaxonomyNode => ({ id, label, children });

// 只细分 general 现有词条，不改变原始大类、ID或用户收藏。允许物品与动作等多归属。
export const generalTaxonomyTree: TaxonomyNode[] = [
  group('body', '身体部位', [leaf('face', '脸部 / 五官'), leaf('torso', '躯干 / 胸腹'), leaf('limbs', '手足 / 四肢'), leaf('fantasy', '兽耳 / 尾巴 / 非人特征')]),
  group('appearance', '外观特征', [leaf('skin', '肤色 / 肤质'), leaf('build', '体型 / 肌肉'), leaf('marks', '痣 / 疤痕 / 纹身'), leaf('cosmetics', '化妆 / 指甲'), leaf('hair', '发型 / 胡须'), leaf('identity', '年龄 / 种族 / 身份特征')]),
  group('clothing', '服装配饰', [leaf('upper', '上衣 / 外套'), leaf('lower', '裙裤 / 袜鞋'), leaf('outfits', '制服 / 套装'), leaf('accessories', '首饰 / 穿戴配件'), leaf('details', '款式 / 装饰细节')]),
  group('animals', '动物 / 生物', [leaf('mammals', '猫狗 / 哺乳动物'), leaf('birds', '鸟类'), leaf('aquatic', '鱼类 / 水生动物'), leaf('insects', '昆虫 / 爬行小动物'), leaf('fantasy', '幻想 / 机械生物')]),
  group('plants', '植物 / 花卉', [leaf('flowers', '花朵 / 花瓣'), leaf('foliage', '树木 / 枝叶'), leaf('fungi', '菌类 / 其他植物')]),
  group('objects', '日常道具', [leaf('household', '家具 / 居家用品'), leaf('electronics', '手机 / 电子设备'), leaf('stationery', '书籍 / 文具'), leaf('bags', '包袋 / 容器'), leaf('tools', '工具 / 医疗用品'), leaf('music', '乐器 / 音乐'), leaf('sports', '运动器材'), leaf('toys', '玩具 / 游戏用品')]),
  group('food', '食品 / 饮料', [leaf('produce', '水果 / 蔬菜'), leaf('prepared', '料理 / 主食'), leaf('sweets', '甜点 / 零食'), leaf('drinks', '饮料 / 餐具')]),
  group('weapons', '武器 / 装备', [leaf('melee', '刀剑 / 近战'), leaf('ranged', '枪械 / 弓箭'), leaf('equipment', '护具 / 军用装备')]),
  group('vehicles', '交通工具', [leaf('land', '车辆 / 陆上交通'), leaf('air', '飞行器'), leaf('water', '船只 / 水上交通')]),
  group('composition', '画面构图', [leaf('framing', '景别 / 人物取景'), leaf('viewpoint', '视角 / 透视'), leaf('layout', '分镜 / 边框 / 布局'), leaf('focus', '焦点 / 景深 / 裁切'), leaf('censoring', '遮挡 / 修正状态')]),
  group('interaction', '动作 / 人物关系', [leaf('actions', '姿态 / 动作 / 持物'), leaf('affection', '亲密 / 日常互动'), leaf('relationships', '关系 / 身份')]),
  group('text', '文字 / 标注', [leaf('language', '文字 / 语言'), leaf('bubbles', '对话框 / 符号'), leaf('credits', '签名 / 水印 / 署名'), leaf('signs', '旗帜 / 标牌')]),
  group('effects', '视觉 / 环境效果', [leaf('motion', '动态线 / 残影'), leaf('particles', '光点 / 魔法 / 粒子'), leaf('condition', '水 / 汗 / 表面状态')]),
  group('expression', '表情 / 眼部细节', [leaf('emotion', '情绪 / 神态'), leaf('eyes', '眼型 / 眼部状态'), leaf('emoticons', '符号表情')]),
  group('environment', '场景 / 自然环境', [leaf('sky', '天空 / 天体'), leaf('landscape', '地貌 / 自然景观'), leaf('architecture', '建筑 / 空间'), leaf('weather', '天气 / 季节')]),
  group('themes', '创作主题 / 表现', [leaf('cosplay', '角色扮演 / 变装'), leaf('parody', '梗 / 戏仿 / 跨界'), leaf('genre', '题材 / 节日'), leaf('render', '画法 / 色彩 / 风格')]),
  group('mature', '裸露 / 成人内容', [leaf('nudity', '裸露状态'), leaf('anatomy', '私密部位'), leaf('sexual', '性行为 / 相关物品'), leaf('fluids', '体液')]),
  leaf('other', '其他 / 待细分'),
];

const boundary = (alternatives: string) => new RegExp(`(?:^|_)(?:${alternatives})(?:_|$)`);
const words = (path: string, alternatives: string, exclude?: string): TaxonomyRule => ({
  path: path.split('/'), pattern: boundary(alternatives), ...(exclude ? { exclude: boundary(exclude) } : {}),
});
// 括号中的限定必须显式列出；使用词边界，避免把 cape 当 cap、gunship 当 gun。
const animalFeatures = 'ears?|tail|tails|wings?|horns?|print|pattern|costume|hood|hat|mask|hairband|hairclip|ornament|bow|bag|slippers|girl|boy|gill|gills|hands|feet|nose|eyes|paws|fur|skin|stuffed|plushie|teddy_bear|playboy_bunny|baseball_bat|dog_tags';

export const generalTaxonomyRules: TaxonomyRule[] = [
  words('body/face', 'face|facial|cheek|cheeks|chin|forehead|nose|nostrils|mouth|lips|lip|teeth|tooth|tongue|fang|fangs|ear|ears|eyebrow|eyebrows|eyelashes'),
  words('body/torso', 'breasts|breast|chest|cleavage|nipples|nipple|areolae|areola|navel|stomach|belly|abdomen|collarbone|shoulder|shoulders|armpit|armpits|waist|hips|hip|midriff|back|ass|butt|buttocks|sideboob|underboob', 'on_back|behind_back|back_to_back|back_view|looking_back|back_print'),
  words('body/limbs', 'arm|arms|hand|hands|finger|fingers|thumb|elbow|elbows|wrist|wrists|leg|legs|thigh|thighs|knee|knees|ankle|ankles|foot|feet|toe|toes|soles|barefoot'),
  words('body/fantasy', 'animal_ears|cat_ears|dog_ears|fox_ears|rabbit_ears|bunny_ears|horse_ears|wolf_ears|fake_animal_ears|pointy_ears|animal_ear_fluff|tail|tails|horn|horns|antlers|wings|wing|halo|fins|gills|tentacles|claws|paws|scales|hooves'),

  words('appearance/skin', 'skin|dark-skinned|pale-skinned|tan|tanned|tanlines|sunburn|freckles|albino|albinism|shiny_skin|skindentation|veins|fur|body_fur'),
  words('appearance/build', 'muscle|muscles|muscular|abs|pectorals|biceps|toned|slim|skinny|plump|chubby|curvy|fat|obese|tall|short_stature|petite|wide_hips|thick_thighs|flat_chest|height_difference|mini_person'),
  words('appearance/marks', 'mole|moles|scar|scars|tattoo|tattoos|birthmark|bruise|bruises|facial_mark|facial_tattoo|bodypaint|body_paint|wound|wounds'),
  words('appearance/cosmetics', 'makeup|eyeliner|eyeshadow|mascara|lipstick|lipgloss|nail|nails|fingernails|toenails|manicure|pedicure|nail_polish'),
  words('appearance/hair', 'hair|bangs|ponytail|twintails|braid|braids|bob_cut|two_side_up|one_side_up|ahoge|sidelocks|hairbun|hair_bun|beard|mustache|stubble|sideburns|twin_drills|half_updo|blunt_ends'),
  words('appearance/identity', 'child|adult|mature_female|mature_male|age_difference|aged_down|aged_up|androgynous|bishounen|elf|fairy|demon|oni|angel|vampire|ghost|android|robot|mecha|cat_girl|fox_girl|dog_girl|horse_girl|rabbit_girl|wolf_girl|dragon_girl|monster_girl|kemonomimi_mode|personification|genderswap'),

  words('clothing/upper', 'shirt|t-shirt|blouse|sweater|cardigan|hoodie|vest|tank_top|crop_top|coat|jacket|blazer|cape|capelet|cloak|poncho|turtleneck|robe|camisole|corset|shawl|shrug_\\(clothing\\)|front-tie_top'),
  words('clothing/lower', 'pants|trousers|shorts|jeans|skirt|skirts|miniskirt|hakama|thighhighs|thighhigh|kneehighs|socks|stockings|pantyhose|tights|leggings|shoes|boots|sandals|sneakers|heels|slippers|legwear|footwear|loafers|mary_janes|buruma|garter_straps'),
  words('clothing/outfits', 'uniform|serafuku|sailor_uniform|school_uniform|suit|tuxedo|dress|gown|kimono|yukata|hanfu|qipao|cheongsam|leotard|bodysuit|swimsuit|bikini|armor|armour|breastplate|pajamas|lingerie|underwear|panties|bra|bloomers'),
  words('clothing/accessories', 'jewelry|jewellery|earrings|earring|necklace|bracelet|anklet|choker|ring|glasses|sunglasses|eyewear|goggles|eyepatch|monocle|mask|bow|ribbon|hairband|hairclip|hairpin|headdress|headband|hair_ornament|neckerchief|scarf|necktie|ascot|belt|sash|thigh_strap|wrist_cuffs|piercing|scrunchie|obi|headgear|crown|tiara|veil|brooch|pendant|suspenders|armband|armlet|wristband|circlet|bandana|beanie|hat|cap|watch|bell|jingle_bell|neck_bell|beads|gem', 'bow_\\(weapon\\)|bow_\\(archery\\)|ring_\\(weapon\\)|ring_\\(geometry\\)'),
  words('clothing/details', 'frill|frills|ruffles|lace|fur_trim|gold_trim|buttons|button|zipper|pocket|pockets|strapless|off_shoulder|bare_shoulders|halterneck|highleg|cutout|cleavage_cutout|sleeveless|collar|sleeves|striped|plaid|floral_print|animal_print|polka_dot|fishnets|zettai_ryouiki|denim|leather|silk|satin|velvet|wool|tassel|buckle|lapels|epaulettes|side_slit|drawstring|double-breasted|fabric'),

  words('animals/mammals', 'cat|cats|kitten|kittens|dog|dogs|puppy|puppies|fox|wolf|horse|pony|rabbit|bunny|hamster|mouse|rat|squirrel|bear|panda|tiger|lion|leopard|deer|sheep|goat|cow|pig|bat|monkey|animal|pet', `${animalFeatures}|hot_dog|mouse_\\(computer\\)|mouse_pad|piggy_bank`),
  words('animals/birds', 'bird|birds|chick|chicken|duck|goose|swan|crow|raven|owl|pigeon|dove|parrot|penguin|eagle|hawk|sparrow|flamingo', `${animalFeatures}|fried_chicken|roast_chicken|rubber_duck`),
  words('animals/aquatic', 'fish|goldfish|koi|shark|dolphin|whale|jellyfish|octopus|squid|crab|lobster|shrimp|seahorse|seal|sea_lion|stingray|manta_ray|eel', `${animalFeatures}|fishnet|fishnets|fried|grilled|cooked|sushi|sashimi`),
  words('animals/insects', 'butterfly|butterflies|moth|bee|beetle|ladybug|dragonfly|firefly|spider|ant|insect|bug|snail|snake|lizard|turtle|frog|toad|crocodile', animalFeatures),
  words('animals/fantasy', 'dragon|wyvern|unicorn|griffin|phoenix|slime|monster|creature|pokemon_\\(creature\\)|digimon_\\(creature\\)|mechanical_animal', animalFeatures),

  words('plants/flowers', 'flower|flowers|floral|petals|petal|rose|roses|cherry_blossoms|sakura|sunflower|tulip|lotus|lily|lilies|daisy|dandelion|hydrangea|hibiscus|bouquet|wreath|\\(flower\\)', 'print|pattern|tattoo|hair_ornament|hairclip'),
  words('plants/foliage', 'tree|trees|branch|branches|leaf|leaves|foliage|vine|vines|bamboo|pine_tree|palm_tree|maple_leaf|grass|bush|shrub|fern|ivy|acorn'),
  words('plants/fungi', 'mushroom|mushrooms|fungus|cactus|cacti|succulent|seaweed|algae|moss|potted_plant|plant|plants'),

  words('objects/household', 'chair|chairs|table|desk|bed|bed_sheet|pillow|cushion|blanket|sofa|couch|stool|shelf|bookshelf|cabinet|mirror|clock|alarm_clock|curtain|curtains|window|door|bathtub|towel|lamp|fan|umbrella|parasol'),
  words('objects/electronics', 'phone|cellphone|smartphone|telephone|headphones|earphones|earbuds|computer|laptop|tablet|keyboard|monitor|television|camera|microphone|speaker|speakers|game_console|controller|usb|cable|wire|wires|battery|mouse_\\(computer\\)'),
  words('objects/stationery', 'book|books|notebook|paper|newspaper|magazine|letter|envelope|pen|pencil|crayon|paintbrush|eraser|ruler|scissors|clipboard|sketchbook|scroll|map|bookmark'),
  words('objects/bags', 'bag|bags|handbag|backpack|purse|satchel|suitcase|briefcase|basket|box|boxes|chest_\\(container\\)|bottle|jar|can|bucket|pouch|wallet'),
  words('objects/tools', 'key|keys|chain|rope|hammer|wrench|screwdriver|tool|tools|broom|mop|shovel|fishing_rod|fishing_pole|bandage|bandages|bandaid|syringe|stethoscope|thermometer|crutch|crutches|wheelchair|medicine|medical_mask'),
  words('objects/music', 'instrument|guitar|bass_guitar|piano|keyboard_\\(instrument\\)|violin|cello|flute|trumpet|saxophone|drum|drums|drumsticks|tambourine|harp|accordion|musical_note|sheet_music'),
  words('objects/sports', 'ball|basketball|baseball|soccer_ball|volleyball|tennis_ball|tennis_racket|baseball_bat|golf_club|skateboard|surfboard|snowboard|skis|dumbbell|barbell|racket|pom_poms|exercise_equipment'),
  words('objects/toys', 'toy|toys|doll|dolls|plushie|stuffed_animal|teddy_bear|puppet|marionette|balloon|balloons|dice|playing_card|playing_cards|chess|shogi|mahjong|rubik.s_cube|figurine|building_blocks'),

  words('food/produce', 'fruit|fruits|apple|apples|banana|bananas|orange_\\(fruit\\)|lemon|lime|strawberry|strawberries|cherry|cherries|grape|grapes|peach|pear|melon|watermelon|pineapple|tomato|carrot|potato|vegetable|vegetables|cabbage|lettuce|corn|eggplant|cucumber'),
  words('food/prepared', 'food|meal|rice|onigiri|sushi|sashimi|ramen|noodles|udon|soba|pasta|spaghetti|pizza|burger|hamburger|sandwich|hot_dog|bread|toast|bento|curry|soup|stew|steak|meat|sausage|egg|eggs|omelette|dumpling|gyoza|takoyaki'),
  words('food/sweets', 'cake|cakes|cupcake|cookie|cookies|biscuit|chocolate|candy|lollipop|ice_cream|popsicle|donut|doughnut|pudding|parfait|macaron|waffle|pancake|taiyaki|dango|mochi|snack|chips|popcorn'),
  words('food/drinks', 'drink|drinks|beverage|tea|coffee|bubble_tea|juice|soda|cola|lemonade|milk|milkshake|beer|wine|sake|cocktail|cup|mug|glass|teacup|teapot|kettle|plate|bowl|chopsticks|fork|spoon|straw|cutlery'),

  words('weapons/melee', 'sword|swords|katana|wakizashi|dagger|knife|blade|saber|sabre|rapier|claymore|greatsword|spear|lance|halberd|polearm|scythe|axe|mace|club|warhammer|bayonet|kunai|shuriken|staff', 'kitchen_knife|butter_knife|golf_club|club_\\(room\\)'),
  words('weapons/ranged', 'gun|guns|pistol|handgun|revolver|rifle|shotgun|machine_gun|submachine_gun|sniper_rifle|assault_rifle|firearm|firearms|crossbow|bow_\\(weapon\\)|bow_\\(archery\\)|arrow|arrows|bullet|bullets|ammunition|cartridge|quiver|rocket_launcher|cannon', 'water_gun|toy_gun|nail_gun|glue_gun|arrow_\\(symbol\\)|arrow_\\(cursor\\)'),
  words('weapons/equipment', 'weapon|weapons|shield|shields|armor|armour|helmet|holster|sheath|scabbard|grenade|bomb|missile|torpedo|military|tactical|bulletproof_vest'),

  words('vehicles/land', 'car|cars|automobile|truck|bus|van|taxi|limousine|motorcycle|motorbike|scooter|bicycle|bike|train|tram|railway|locomotive|subway|tank|vehicle|vehicles|wheel|wheels|steering_wheel|motor_vehicle', 'tank_top'),
  words('vehicles/air', 'airplane|plane|aircraft|helicopter|jet|fighter_jet|biplane|airship|blimp|hot_air_balloon|spaceship|spacecraft|rocket|gunship|drone', 'paper_airplane|model_airplane'),
  words('vehicles/water', 'ship|boat|boats|sailboat|sailing_ship|battleship|warship|submarine|canoe|kayak|yacht|ferry|gondola|raft|jet_ski'),

  words('composition/framing', 'portrait|close-up|extreme_close-up|full_body|upper_body|lower_body|cowboy_shot|bust|wide_shot'),
  words('composition/viewpoint', 'from_above|from_below|from_side|from_behind|from_front|dutch_angle|pov|perspective|foreshortening|fish-eye|fisheye|profile|back_view|front_view|side_view|isometric|straight-on|upside-down|facing_viewer|facing_away'),
  words('composition/layout', 'composition|multiple_views|comic|4koma|2koma|panel|panels|split_screen|border|frame|framed|inset|collage|reference_sheet|character_sheet|symmetry|symmetrical|asymmetrical|triptych|cover|cover_page|doujin_cover|letterboxed|zoom_layer|tachi-e', 'out_of_frame'),
  words('composition/focus', 'focus|depth_of_field|bokeh|blurry|blur|cropped|out_of_frame|cropping|silhouette|negative_space'),

  words('interaction/actions', 'holding|carrying|grabbing|touching|reaching|looking|waving|pointing|walking|running|jumping|dancing|flying|floating|swimming|standing|sitting|kneeling|lying|crouching|squatting|leaning|stretching|on_back|on_side|on_stomach|hand_on|hands_on|arms_behind_back|head_tilt|v|peace_sign|eating|drinking|reading|writing|sleeping|playing|wariza|seiza|all_fours|bent_over|straddling|wading|dual_wielding|head_rest|contrapposto|smoking'),
  words('interaction/affection', 'hug|hugging|embrace|cuddling|kiss|kissing|holding_hands|hand_holding|headpat|lap_pillow|piggyback|princess_carry|high_five|cheek_kiss'),
  words('interaction/relationships', 'siblings|sisters|brothers|twins|family|mother|father|daughter|son|parent|parents|couple|married_couple|wedding|friends|hetero|yuri|yaoi|maid|nurse|witch|magical_girl|virtual_youtuber|cosplay|furry|demon_girl'),

  words('text/language', 'text|english_text|japanese_text|chinese_text|korean_text|russian_text|french_text|german_text|arabic_text|spanish_text|handwriting|calligraphy|kanji|hiragana|katakana|furigana|lettering|typography|subtitles'),
  words('text/bubbles', 'speech_bubble|thought_bubble|heart|hearts|star_\\(symbol\\)|symbol|symbols|exclamation_mark|question_mark|ellipsis|anger_vein|musical_note|sound_effects|emoticon|kaomoji'),
  words('text/credits', 'signature|watermark|artist_name|artist_logo|username|twitter_username|character_name|copyright_name|copyright_notice|dated|date|patreon_logo|website|web_address|url|logo'),

  words('effects/motion', 'motion_lines|speed_lines|motion_blur|afterimage|afterimages|impact|impact_lines|emphasis_lines|action_lines|trembling|vibrating|wavy_lines'),
  words('effects/particles', 'sparkle|sparkles|sparkling|glitter|glowing|glow|magic|magic_circle|aura|energy|electricity|lightning|flame|flames|fire|smoke|steam|bubble|bubbles|confetti|feather|feathers|snowflakes', 'speech_bubble|thought_bubble|bubble_tea'),
  words('effects/condition', 'water|wet|sweat|sweatdrop|sweatdrops|droplet|droplets|dripping|soaked|blood|bloody|dirt|dirty|mud|muddy|dust|torn|broken|cracked|melting|frozen|ice|frost'),

  words('expression/emotion', 'happy|smug|smile|smiling|grin|laughing|sad|crying|tears|tearing_up|blush|embarrassed|angry|annoyed|pout|surprised|scared|sleepy|bored|expressionless|serious|furrowed_brow'),
  words('expression/eyes', 'tsurime|tareme|jitome|wide-eyed|sclera|colored_sclera|pupil|pupils|closed_eyes|half-closed_eyes|wink|winking|sideways_glance'),
  { path: ['expression', 'emoticons'], pattern: /^(?::3|:d|;d|:p|:q|:t|:<|:>|:o|:\||;\||\^_\^|>_<|@_@|\+_\+|=_=|o_o|0_0|t_t|x_x|\^\^\^|\.\.\.|[!?]+)$/ },

  words('environment/sky', 'sky|moon|full_moon|sun|sunrise|sunset|star_\\(sky\\)|stars|planet|planets|earth_\\(planet\\)|constellation|\\(constellation\\)|galaxy|nebula|outer_space|shooting_star|milky_way'),
  words('environment/landscape', 'nature|landscape|mountain|mountains|hill|valley|forest|woods|beach|ocean|sea|river|lake|pond|waterfall|sand|desert|rock|rocks|stone|cave|island|coast|shore|ground|field'),
  words('environment/architecture', 'building|city|cityscape|street|road|bridge|castle|temple|shrine|church|house|room|bedroom|classroom|kitchen|bathroom|office|shop|cafe|library|floor|wooden_floor|stairs|tiles|wall|roof|balcony|patio|indoors|outdoors'),
  words('environment/weather', 'wind|windy|rain|raining|snow|snowing|cloud|clouds|cloudy|fog|mist|storm|thunderstorm|spring|summer|autumn|winter|season|night|day|dusk|dawn'),

  words('themes/cosplay', 'cosplay|\\(cosplay\\)|crossdressing|\\(crossdressing\\)|enmaided'),
  words('themes/parody', 'meme|\\(meme\\)|parody|crossover|reference|homage'),
  words('themes/genre', 'science_fiction|fantasy|cyberpunk|steampunk|horror|christmas|halloween|valentine|valentine.s_day|new_year|birthday|happy_birthday|easter|festival'),
  words('themes/render', '\\(style\\)|style|monochrome|greyscale|grayscale|spot_color|theme|outline|chromatic_aberration|watercolor|sketch|lineart|pixel_art|3d|chibi|realistic|gradient|silhouette'),

  words('mature/nudity', 'nude|naked|topless|bottomless|completely_nude|clothed_female_nude_male|clothed_male_nude_female|undressing|nudity|exposed_breasts|exposed_genitals'),
  words('mature/anatomy', 'penis|pussy|anus|testicles|scrotum|genitals|groin|pubic_hair|erection|foreskin|clitoris|vulva|vagina|crotch|cameltoe'),
  words('mature/sexual', 'sex|sexual|vaginal|anal|oral|fellatio|cunnilingus|masturbation|handjob|footjob|paizuri|groping|penetration|bdsm|bondage|dildo|vibrator|condom|sex_toy|orgasm|ahegao'),
  words('mature/fluids', 'cum|semen|ejaculation|precum|pussy_juice|saliva|drool|drooling|lactation|breast_milk'),
];
