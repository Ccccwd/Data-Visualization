import { readFileSync, writeFileSync } from 'fs'

const data = JSON.parse(readFileSync('src/data/binhong_data.json', 'utf8'))

// Add isArtMilestone to existing entries
const artMilestoneYears = new Set([1885, 1905, 1919, 1923, 1935, 1945, 1955])
data.historyContext.forEach((h) => {
  h.isArtMilestone = artMilestoneYears.has(h.year)
})

// Add new history context entries
const newEntries = [
  {
    year: 1885, pressureIndex: 3, era: '少年求学',
    events: ['新安画派传统浸润', '金华师从郑珊学画'],
    summary: '黄宾虹二十岁前后，在金华随郑珊学画，开始系统接触新安画派传统。这一时期奠定了他一生以山水画为志业的基础。',
    personalNote: '少年黄宾虹在金华的书香环境中成长，随当地画家郑珊习画。新安画派的渐江、查士标等先辈的作品，为他植入了"以画为学"的种子。',
    insight: '新安画派的"以意驭笔"精神，在黄宾虹少年时期即已根植。这条从临摹到自悟的路径，贯穿了他从金华到上海的整个艺术成长期。',
    isWarRelated: false, isPoliticalTurning: false, isArtMilestone: true
  },
  {
    year: 1912, pressureIndex: 6, era: '民国初立',
    events: ['中华民国成立', '神州日报活跃期', '海上题襟馆书画会活动'],
    summary: '民国元年，黄宾虹在上海积极投身文化重建。继续参与《神州日报》编辑工作，同时融入海上书画界核心圈层。',
    personalNote: '辛亥革命后，黄宾虹从政治革命转向文化守护。他在上海与海上题襟馆书画会同人交往密切，开始将革命激情转化为艺术创造力。',
    insight: '民国初年，大量传统文人涌入上海租界，形成了独特的"海上文化圈"。黄宾虹在此完成身份转换——从革命者变为学者型画家，这一转变为日后"浑厚华滋"画风的形成提供了文化土壤。',
    isWarRelated: false, isPoliticalTurning: false, isArtMilestone: false
  },
  {
    year: 1923, pressureIndex: 4, era: '金石鼎盛',
    events: ['创作年谱最密集年份', '金石学研究深入', '古玺印谱编纂'],
    summary: '1923年是黄宾虹一生中创作和学术活动最密集的年份，年谱记录达116条之多。金石学研究和绘画创作齐头并进。',
    personalNote: '此年黄宾虹专注于古玺印研究，编纂印谱，同时在画论方面有重要著述。大量临摹古画、研究笔墨，为后来的画风突破积累了丰厚的技法储备。',
    insight: '1923年的密集活动揭示了一个规律：黄宾虹的艺术创新并非灵光一现，而是建立在海量临摹和学术研究基础上的"厚积薄发"。金石学的考据方法深刻影响了他对笔墨的理解。',
    isWarRelated: false, isPoliticalTurning: false, isArtMilestone: true
  },
  {
    year: 1935, pressureIndex: 5, era: '京沪之间',
    events: ['上海美术活动频繁', '画论著述丰富', '与西方艺术界交流'],
    summary: '1935年前后，黄宾虹在上海和各地频繁参与美术活动，画论著述进入成熟期。开始受到西方艺术界的关注。',
    personalNote: '成熟期的黄宾虹在传统与创新之间找到了独特的平衡点。他提出"五笔七墨"理论，系统总结了中国画笔墨的核心技法，这一理论至今仍是研究中国画的重要参考。',
    insight: '黄宾虹的"五笔七墨"理论（平、圆、留、重、变五种笔法，浓、淡、破、泼、积、焦、宿七种墨法）不是抽象的教条，而是从数十年创作实践中提炼的方法论。这种"以学养画"的模式，是中国画传统的精华所在。',
    isWarRelated: false, isPoliticalTurning: false, isArtMilestone: true
  },
  {
    year: 1943, pressureIndex: 8, era: '困居北平',
    events: ['拒绝与日本画家荒木十亩会面', '与傅雷书信往还', '古画临摹不辍'],
    summary: '困居沦陷区第六年，黄宾虹以"头痛病复发"为由拒绝与日本画家荒木十亩会面。与傅雷的书信往还成为他在孤岛中的精神支柱。',
    personalNote: '在沦陷区的艰难环境中，黄宾虹通过大量临摹古画和研究笔墨来维持内心的平静。与傅雷的通信成为他最重要的精神交流——傅雷称他为"生平最大知己"。',
    insight: '沦陷区的文化守望者往往面临双重困境：既不能公开抵抗（危及生命），又不愿合作（丧失气节）。黄宾虹以"病不出户"的方式化解这一矛盾——既保持了人格气节，又未停止文化传承。',
    isWarRelated: true, isPoliticalTurning: false, isArtMilestone: false
  },
  {
    year: 1947, pressureIndex: 5, era: '内战岁月',
    events: ['国共内战全面爆发', '通货膨胀严重', '杭州栖霞岭定居'],
    summary: '抗战胜利后不久，国共内战爆发。黄宾虹在杭州栖霞岭定居，在动荡中专注于晚年创作。物价飞涨中，以画易米的文人生活更显艰辛。',
    personalNote: '内战期间，黄宾虹虽已年逾八旬，但仍坚持每日作画。在栖霞岭的小楼中，画稿堆积如山，真正做到了"卧游山水之中"。',
    insight: '黄宾虹的晚年变法（1945-1955）恰逢中国社会最剧烈的转型期。在国共内战和新中国成立的大背景下，他的"浑厚华滋"画风既是个人技法巅峰的体现，也是传统文化在巨变中寻找新生命的象征。',
    isWarRelated: true, isPoliticalTurning: false, isArtMilestone: false
  },
  {
    year: 1950, pressureIndex: 6, era: '新篇初启',
    events: ['新中国文化建设起步', '传统中国画何去何从', '华东美术学院活动'],
    summary: '新中国成立第二年，文化艺术界全面重构。传统中国画面临"为谁画、画什么"的时代拷问。',
    personalNote: '年逾八十七岁的黄宾虹积极适应新时代，参与华东美术学院活动。他坚持认为传统笔墨有其不可替代的价值，在新政权的文化框架中为中国画争取生存空间。',
    insight: '1949年后，中国美术界出现"国画改造"运动，要求传统画家深入生活、表现劳动人民。黄宾虹虽未直接参与这场运动，但其"浑厚华滋"的美学主张——追求浑然天成的笔墨境界——与新时代"颂扬祖国山河"的主题不谋而合。',
    isWarRelated: false, isPoliticalTurning: false, isArtMilestone: false
  }
]

data.historyContext.push(...newEntries)
data.historyContext.sort((a, b) => a.year - b.year)

writeFileSync('src/data/binhong_data.json', JSON.stringify(data, null, 2), 'utf8')
console.log(`Added ${newEntries.length} entries, total ${data.historyContext.length} historyContext items`)
