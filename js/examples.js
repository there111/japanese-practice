/** 模板例句生成器 */

const PATTERNS = [
  { ja: '毎日{v}。', cn: '每天{v}。' },
  { ja: '私は{v}。', cn: '我{v}。' },
  { ja: '彼は{v}。', cn: '他{v}。' },
  { ja: '一緒に{v}。', cn: '一起{v}。' },
  { ja: '昨日{v}た。', cn: '昨天{v}了。' },
  { ja: 'まだ{v}ていません。', cn: '还没{v}。' },
  { ja: '{v}たいです。', cn: '想要{v}。' },
  { ja: '{v}ことができます。', cn: '会{v}。' },
  { ja: '{v}ましょう。', cn: '让我们{v}吧。' },
  { ja: '{v}ないでください。', cn: '请不要{v}。' },
]

function conjugateForPattern(verb, pattern) {
  const { kana, conj_type } = verb
  if (!conj_type || !kana) return null

  try {
    // 简单取辞书形
    if (pattern.includes('{v}た')) {
      // 需要た形
      const stem = conj_type === 'ichidan' ? kana.slice(0, -1) :
                   conj_type === 'godan' ? kana.slice(0, -1) : kana
      return taForm(kana, conj_type, stem)
    }
    if (pattern.includes('{v}て')) {
      return teForm(kana, conj_type)
    }
    if (pattern.includes('{v}たい')) {
      const stem = conj_type === 'ichidan' ? kana.slice(0, -1) :
                   conj_type === 'godan' ? kana.slice(0, -1) + 'i' : kana
      // 连用形 + たい
      return renyoForm(kana, conj_type) + 'たい'
    }
    if (pattern.includes('{v}ことが')) {
      return kana
    }
    if (pattern.includes('{v}ましょう')) {
      return renyoForm(kana, conj_type) + 'ましょう'
    }
    if (pattern.includes('{v}ない')) {
      return naiForm(kana, conj_type)
    }
  } catch (e) {
    return null
  }
  return null
}

function naiForm(kana, type) {
  const stem = kana.slice(0, -1)
  const end = kana.slice(-1)
  if (type === 'ichidan') return stem + 'ない'
  if (type === 'godan') return stem + mapA(end) + 'ない'
  if (type === 'sahen') return kana.replace(/する$/, '') + 'しない'
  if (type === 'kahen') return '来ない'
  return kana
}

function teForm(kana, type) {
  const stem = kana.slice(0, -1)
  const end = kana.slice(-1)
  if (type === 'ichidan') return stem + 'て'
  if (type === 'godan') return stem + mapTe(end)
  if (type === 'sahen') return kana.replace(/する$/, '') + 'して'
  if (type === 'kahen') return '来て'
  return kana
}

function taForm(kana, type, stem) {
  const end = kana.slice(-1)
  if (type === 'ichidan') return (stem || kana.slice(0, -1)) + 'た'
  if (type === 'godan') return (stem || kana.slice(0, -1)) + mapTa(end)
  if (type === 'sahen') return kana.replace(/する$/, '') + 'した'
  if (type === 'kahen') return '来た'
  return kana
}

function renyoForm(kana, type) {
  const stem = kana.slice(0, -1)
  const end = kana.slice(-1)
  if (type === 'ichidan') return stem
  if (type === 'godan') return stem + mapI(end)
  if (type === 'sahen') return kana.replace(/する$/, '') + 'し'
  if (type === 'kahen') return '来'
  return kana
}

const GODAN = {
  'う': { a:'わ', i:'い', e:'え', o:'お', te:'って', ta:'った' },
  'く': { a:'か', i:'き', e:'け', o:'こ', te:'いて', ta:'いた' },
  'ぐ': { a:'が', i:'ぎ', e:'げ', o:'ご', te:'いで', ta:'いだ' },
  'す': { a:'さ', i:'し', e:'せ', o:'そ', te:'して', ta:'した' },
  'つ': { a:'た', i:'ち', e:'て', o:'と', te:'って', ta:'った' },
  'ぬ': { a:'な', i:'に', e:'ね', o:'の', te:'んで', ta:'んだ' },
  'ぶ': { a:'ば', i:'び', e:'べ', o:'ぼ', te:'んで', ta:'んだ' },
  'む': { a:'ま', i:'み', e:'め', o:'も', te:'んで', ta:'んだ' },
  'る': { a:'ら', i:'り', e:'れ', o:'ろ', te:'って', ta:'った' },
}

function mapA(e) { return GODAN[e]?.a || e }
function mapI(e) { return GODAN[e]?.i || e }
function mapTe(e) { return GODAN[e]?.te || 'って' }
function mapTa(e) { return GODAN[e]?.ta || 'った' }

/** 给一个动词生成一个例句 */
export function generateExample(verb) {
  const idx = Math.floor(Math.random() * PATTERNS.length)
  const p = PATTERNS[idx]

  // 对于包含特定词尾变换的模式，尝试变形
  let conj = null
  if (p.ja.includes('{v}た') || p.ja.includes('{v}て') ||
      p.ja.includes('{v}たい') || p.ja.includes('{v}ましょう') ||
      p.ja.includes('{v}ない')) {
    conj = conjugateForPattern(verb, p.ja)
  }

  const v = conj || verb.kana
  const ja = p.ja.replace('{v}', v)
  const cn = p.cn.replace('{v}', verb.gloss_cn?.split('；')[0]?.split('，')[0] || verb.word)

  return { ja, cn }
}

/** 按形态生成例句 */
const FORM_PATTERNS = {
  nai:     { ja: 'まだ{v}。', cn: '还没{v}。' },
  te:      { ja: '{v}ください。', cn: '请{v}。' },
  ta:      { ja: 'もう{v}。', cn: '已经{v}了。' },
  shushi:  { ja: '{v}ことができます。', cn: '会{v}。' },
  kanou:   { ja: '{v}ます。', cn: '能{v}。' },
  ukemi:   { ja: '{v}ました。', cn: '被{v}了。' },
  shieki:  { ja: '{v}。', cn: '让{v}。' },
  ishi:    { ja: '{v}と思います。', cn: '想要{v}。' },
  meirei:  { ja: '{v}！', cn: '去{v}！' },
  katei:   { ja: '{v}ばいいです。', cn: '{v}的话就好了。' },
}

export function generateFormExample(verb, formKey, conjugated) {
  const p = FORM_PATTERNS[formKey]
  if (!p) return { ja: conjugated, cn: verb.gloss_cn || '' }
  const meaning = verb.gloss_cn?.split('；')[0]?.split('，')[0] || verb.word
  return {
    ja: p.ja.replace('{v}', conjugated),
    cn: p.cn.replace('{v}', meaning),
  }
}

/** 形容词例句模板 */
const ADJ_FORM_PATTERNS = {
  nai:     { ja: 'あまり{v}です。', cn: '不太{v}。' },
  te:      { ja: '{v}、楽しいです。', cn: '{v}，很开心。' },
  ta:      { ja: '昨日は{v}です。', cn: '昨天很{v}。' },
  shushi:  { ja: 'これは{v}です。', cn: '这个很{v}。' },
  katei:   { ja: '{v}、買います。', cn: '如果{v}的话就买。' },
  renyou:  { ja: '{v}なりました。', cn: '变得{v}了。' },
}

export function generateAdjFormExample(adj, formKey, conjugated) {
  const p = ADJ_FORM_PATTERNS[formKey]
  if (!p) return { ja: conjugated, cn: adj.gloss_cn || '' }
  const meaning = adj.gloss_cn?.split('；')[0]?.split('，')[0] || adj.word
  return {
    ja: p.ja.replace('{v}', conjugated),
    cn: p.cn.replace('{v}', meaning),
  }
}
