/**
 * 日语动词变形规则引擎
 * 支持：五段/一段/サ変/カ変
 */

const GODAN_MAP = {
  'う': { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' },
  'く': { a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  'ぐ': { a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  'す': { a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  'つ': { a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', ta: 'った' },
  'ぬ': { a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  'ぶ': { a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  'む': { a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  'る': { a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
}

function godanStem(kana) { return kana.slice(0, -1) }
function ichidanStem(kana) { return kana.slice(0, -1) }

function ichidanForms(kana, stem) {
  return {
    mizen: stem,
    renyo: stem,
    shushi: kana,
    rentai: kana,
    katei: stem + 'れ',
    meirei: stem + 'ろ',
    ishi: stem + 'よう',
    kanou: stem + 'られる',
    ukemi: stem + 'られる',
    shieki: stem + 'させる',
    shiekiUkemi: stem + 'させられる',
    te: stem + 'て',
    ta: stem + 'た',
    nai: stem + 'ない',
  }
}

function godanForms(kana, stem, ending) {
  const m = GODAN_MAP[ending]
  if (!m) return null
  return {
    mizen: stem + m.a,
    renyo: stem + m.i,
    shushi: kana,
    rentai: kana,
    katei: stem + m.e,
    meirei: stem + m.e,
    ishi: stem + m.o + 'う',
    kanou: stem + m.e + 'る',
    ukemi: stem + m.a + 'れる',
    shieki: stem + m.a + 'せる',
    shiekiUkemi: stem + m.a + 'せられる',
    te: stem + m.te,
    ta: stem + m.ta,
    nai: stem + m.a + 'ない',
  }
}

function sahenForms(kana) {
  const stem = kana.replace(/する$/, '')
  return {
    mizen: stem + 'し',
    renyo: stem + 'し',
    shushi: stem + 'する',
    rentai: stem + 'する',
    katei: stem + 'すれ',
    meirei: stem + 'しろ',
    ishi: stem + 'しよう',
    kanou: stem + 'できる',
    ukemi: stem + 'される',
    shieki: stem + 'させる',
    shiekiUkemi: stem + 'させられる',
    te: stem + 'して',
    ta: stem + 'した',
    nai: stem + 'しない',
  }
}

function kahenForms() {
  return {
    mizen: '来',
    renyo: '来',
    shushi: '来る',
    rentai: '来る',
    katei: '来れ',
    meirei: '来い',
    ishi: '来よう',
    kanou: '来られる',
    ukemi: '来られる',
    shieki: '来させる',
    shiekiUkemi: '来させられる',
    te: '来て',
    ta: '来た',
    nai: '来ない',
  }
}

export function conjugate(kana, conjType) {
  switch (conjType) {
    case 'ichidan': {
      const stem = ichidanStem(kana)
      return ichidanForms(kana, stem)
    }
    case 'godan': {
      const ending = kana.slice(-1)
      const stem = godanStem(kana)
      return godanForms(kana, stem, ending)
    }
    case 'sahen':
      return sahenForms(kana)
    case 'kahen':
      return kahenForms()
    default:
      return null
  }
}

export const FORM_LABELS = {
  nai: 'ない形（否定）',
  te: 'て形',
  ta: 'た形（过去）',
  shushi: '辞书形（原形）',
  kanou: '可能形',
  ukemi: '被动形',
  shieki: '使役形',
  shiekiUkemi: '使役被动形',
  ishi: '意志形',
  meirei: '命令形',
  katei: '假定形',
}

export const QUIZ_FORMS = ['nai', 'te', 'ta', 'kanou', 'ukemi', 'shieki', 'ishi', 'meirei', 'katei']

export const FORM_EXPLANATIONS = {
  nai:     { meaning: '否定 — "不～"', desc: '表示否定、不做的意思。' },
  te:      { meaning: 'て形 — 连接', desc: '连接句子、表示请求等。' },
  ta:      { meaning: '过去 — "～了"', desc: '表示动作已完成。' },
  shushi:  { meaning: '原形 — 辞书形', desc: '词典中的基本形态。' },
  kanou:   { meaning: '可能 — "能～"', desc: '表示有能力做某事。' },
  ukemi:   { meaning: '被动 — "被～"', desc: '表示被做、受到。' },
  shieki:  { meaning: '使役 — "让～做"', desc: '让/使别人做某事。' },
  shiekiUkemi: { meaning: '使役被动 — "被迫～"', desc: '被迫、不得不做某事。' },
  ishi:    { meaning: '意志 — "想要～"', desc: '表示意志、打算、劝诱。' },
  meirei:  { meaning: '命令 — "做！"', desc: '表示命令、强制。' },
  katei:   { meaning: '假定 — "如果～"', desc: '表示假设条件。' },
}

// ====== 形容词变形 ======

/**
 * イ形容詞变形
 * stem = 去掉末尾「い」(特殊: いい→よ)
 */
function iAdjStem(kana) {
  if (kana === 'いい') return 'よ'
  return kana.slice(0, -1) // 去掉 い
}

function iAdjForms(kana) {
  const stem = iAdjStem(kana)
  return {
    nai: stem + 'くない',
    te: stem + 'くて',
    ta: stem + 'かった',
    shushi: kana,
    katei: stem + 'ければ',
    renyou: stem + 'く',
    sou: stem + 'そうだ',
    sugi: stem + 'すぎる',
  }
}

/**
 * ナ形容詞变形
 * stem = 词干（去掉だ）
 */
function naAdjStem(kana) {
  // ナ形容詞的kana即词干（不含だ）
  return kana
}

function naAdjForms(kana) {
  const stem = naAdjStem(kana)
  return {
    nai: stem + 'ではない',
    te: stem + 'で',
    ta: stem + 'だった',
    shushi: stem + 'だ',
    katei: stem + 'なら',
    renyou: stem + 'に',
  }
}

/** 统一变形入口：支持动词和形容词 */
export function conjugateAdj(kana, adjType) {
  switch (adjType) {
    case 'i': return iAdjForms(kana)
    case 'na': return naAdjForms(kana)
    default: return null
  }
}

/** 形容词变形标签 */
export const ADJ_FORM_LABELS = {
  nai: 'ない形（否定）',
  te: 'て形',
  ta: 'た形（过去）',
  shushi: '辞书形（原形）',
  katei: 'ば形（假定）',
  renyou: '連用形',
}

/** 形容词测验顺序 */
export const ADJ_QUIZ_FORMS = ['nai', 'te', 'ta', 'katei', 'renyou']

/** 形容词变形说明 */
export const ADJ_FORM_EXPLANATIONS = {
  nai:    { meaning: '否定 — "不～"', desc: 'イ形去い＋くない／ナ形＋ではない' },
  te:     { meaning: 'て形 — 连接', desc: 'イ形去い＋くて／ナ形＋で' },
  ta:     { meaning: '过去 — "～了"', desc: 'イ形去い＋かった／ナ形＋だった' },
  shushi: { meaning: '原形 — 辞书形', desc: '词典中的基本形态。' },
  katei:  { meaning: '假定 — "如果～"', desc: 'イ形去い＋ければ／ナ形＋なら' },
  renyou: { meaning: '連用形 — 副词化', desc: 'イ形去い＋く／ナ形＋に' },
}
