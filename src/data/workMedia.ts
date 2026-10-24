import reviewedWorkMedia from './workMediaReviewed.json';

// 人工整理及离线资料核对的作品主标签；明确的 (anime)/(manga)/(game) 限定优先。
// 这些是系列的媒介归属，可多选，不代表每个续作、衍生作品都具有相同媒介。
// 不做前缀自动继承；没有条目或明确限定时保留待细分。
export const workMedia: Record<string, string[]> = {};

const add = (names: string[], media: string[]) => { for (const name of names) workMedia[name] = media; };
add(['genshin_impact', 'honkai:_star_rail', 'zenless_zone_zero', 'honkai_impact_3rd', 'honkai_(series)', 'wuthering_waves', 'reverse:1999', 'limbus_company', 'project_moon', 'league_of_legends', 'street_fighter', 'splatoon_(series)', 'the_legend_of_zelda', 'mario_(series)', 'xenoblade_chronicles_(series)', 'ragnarok_online', 'project_sekai', 'fire_emblem', 'fire_emblem_heroes', 'fire_emblem:_three_houses', 'pokemon_sword_and_shield', 'pokemon_swsh', 'pokemon_scarlet_and_violet', 'pokemon_sv', 'pokemon_sun_and_moon', 'gakuen_idolmaster', 'idolmaster_shiny_colors', 'goddess_of_victory:_nikke'], ['games']);
add(['touhou', 'kantai_collection', 'blue_archive', 'arknights', 'azur_lane', "girls'_frontline", 'fate_(series)', 'fate/grand_order', 'fate/stay_night', 'idolmaster', 'idolmaster_cinderella_girls', 'idolmaster_(classic)', 'idolmaster_million_live!', 'umamusume', 'final_fantasy', 'final_fantasy_vii', 'final_fantasy_xiv', 'danganronpa_(series)', 'danganronpa_2:_goodbye_despair', 'danganronpa_v3:_killing_harmony', 'granblue_fantasy', 'persona', 'princess_connect!'], ['games', 'anime']);
add(['pokemon'], ['games', 'anime', 'manga']);
add(['mahou_shoujo_madoka_magica', 'girls_und_panzer', 'gundam', 'precure', 'love_live!', 'love_live!_school_idol_project', 'love_live!_hasu_no_sora_jogakuin_school_idol_club', "bang_dream!_it's_mygo!!!!!", 'neon_genesis_evangelion', 'lyrical_nanoha', 'world_witches_series'], ['anime']);
add(['one_piece', 'jojo_no_kimyou_na_bouken', 'chainsaw_man', 'boku_no_hero_academia', 'yu-gi-oh!', 'bocchi_the_rock!', 'dragon_ball', 'sousou_no_frieren', 'k-on!', 'naruto_(series)', 'jujutsu_kaisen', 'bleach', 'kimetsu_no_yaiba', 'shingeki_no_kyojin', 'sailor_moon', 'cardcaptor_sakura', 'spy_x_family'], ['anime', 'manga']);
add(['toaru_majutsu_no_index', 'suzumiya_haruhi_no_yuuutsu', 'sword_art_online', 're:zero_kara_hajimeru_isekai_seikatsu', 'kono_subarashii_sekai_ni_shukufuku_wo!'], ['novels', 'anime']);
add(['hololive', 'hololive_english', 'nijisanji', 'indie_virtual_youtuber', 'vocaloid', 'utau', 'voiceroid', 'cevio', 'synthesizer_v'], ['virtual']);
add(['original'], ['original']);
// 具体续作不继承系列的动画归属；动画《弹丸论破3》并非游戏V3。
add(['danganronpa_2:_goodbye_despair', 'danganronpa_v3:_killing_harmony'], ['games']);

// 单独核验的具体游戏；不按系列前缀自动推断后续作。
add(['fire_emblem_fates', 'persona_5', 'persona_3', 'persona_4', 'persona_5_royal', 'persona_5_strikers', 'persona_3_reload', 'persona_4_golden', 'persona_4:_dancing_all_night', 'persona_3:_dancing_in_moonlight', 'persona_5:_dancing_in_starlight', 'tales_of_(series)'], ['games']);
add(['bang_dream!'], ['games', 'anime', 'manga']);
add(['bang_dream!_girls_band_party!'], ['games']);
add(['love_live!_sunshine!!', 'love_live!_nijigasaki_high_school_idol_club'], ['anime']);
add(['nijisanji_en', 'vspo!', 'vspo!_en'], ['virtual']);

// 新增记录只补充之前没有归属的精确标签，来源及方法见公开核对记录。
for (const [name, media] of Object.entries(reviewedWorkMedia)) if (!Object.hasOwn(workMedia, name)) workMedia[name] = media;

export const workMediaSources = [
  { label: 'HoYoverse 官方作品入口', url: 'https://www.hoyoverse.com/en-us/' },
  { label: 'Pokémon 官方：游戏、动画等系列内容', url: 'https://www.pokemon.com/us' },
  { label: 'ONE PIECE 官方门户', url: 'https://one-piece.com/' },
  { label: '孤独摇滚官方动画（原作信息）', url: 'https://bocchi.rocks/' },
  { label: 'Fate 官方作品门户', url: 'https://www.fate-go.jp/' },
  { label: 'Love Live! 官方动画门户', url: 'https://www.lovelive-anime.jp/' },
  { label: 'Nintendo 官方游戏作品', url: 'https://www.nintendo.com/us/' },
  { label: '弹丸论破官方具体游戏作品', url: 'https://www.danganronpa.com/pages/switch/en/' },
  { label: 'Fire Emblem Fates 官方游戏页', url: 'https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Fire-Emblem-Fates-1026071.html' },
  { label: 'ATLUS 官方游戏目录', url: 'https://atlus.com/games/' },
  { label: 'Tales of 官方系列介绍', url: 'https://www.bandainamcoent.com/tales-of-30th-anniversary' },
  { label: 'BanG Dream! Danbooru作品介绍', url: 'https://safebooru.donmai.us/wiki_pages/bang_dream!' },
  { label: 'Love Live! Sunshine!! 官方站', url: 'https://www.lovelive-anime.jp/uranohoshi/' },
  { label: 'Love Live! 虹咲官方站', url: 'https://www.lovelive-anime.jp/nijigasaki/' },
  { label: 'NIJISANJI EN Danbooru介绍', url: 'https://safebooru.donmai.us/wiki_pages/nijisanji_en' },
  { label: 'VSPO! Danbooru介绍', url: 'https://safebooru.donmai.us/wiki_pages/vspo!' },
];
