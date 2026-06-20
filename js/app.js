import { conjugate, conjugateAdj, FORM_LABELS, QUIZ_FORMS, ADJ_FORM_LABELS, ADJ_QUIZ_FORMS } from './conjugation.js'
import { startLearn, bindLearnEvents, getMode } from './learn.js'

// ====== DOM 引用 ======
const $ = id => document.getElementById(id)

// 页面容器
const pages = ['page-home', 'page-learn', 'page-practice', 'page-words']

// 首页元素
const heroBadge = $('heroBadge')
const heroProgressText = $('heroProgressText')
const heroProgressFill = $('heroProgressFill')
const heroReview = $('heroReview')
const heroToday = $('heroToday')
const btnHeroLearn = $('btnHeroLearn')
const btnTheme = $('btnTheme')
const modalStats = $('modalStats')

// 练习页元素
const roundNum = $('roundNum')
const correctNum = $('correctNum')
const quizWord = $('quizWord')
const quizKana = $('quizKana')
const quizMeaning = $('quizMeaning')
const quizFormName = $('quizFormName')
const hintArea = $('hintArea')
const hintAnswer = $('hintAnswer')
const answerInput = $('answerInput')
const btnSubmit = $('btnSubmit')
const resultOverlay = $('resultOverlay')
const resultCard = $('resultCard')
const resultIcon = $('resultIcon')
const resultMsg = $('resultMsg')
const resultWord = $('resultWord')
const resultAnswer = $('resultAnswer')
const pagePractice = $('page-practice')

// 词库页元素
const searchInput = $('searchInput')
const wordList = $('wordList')
const emptyMsg = $('emptyMsg')
const totalWords = $('totalWords')

// ====== 状态 ======
const LEVELS = [5, 4, 3, 2, 1]
let currentLevel = 5
let verbCache = {}
let verbCounts = {}
let adjCache = {}
let adjCounts = {}
let studyMode = 'verb'  // 'verb' | 'adj'

// 练习状态
let wordList_ = []
let round = 1
let correct = 0

// 词库状态
let currentVerbList = []

// ====== 页面切换 ======
function showPage(name) {
  pages.forEach(id => { const el = $(id); if (el) el.classList.remove('active') })
  const target = $('page-' + name)
  if (target) target.classList.add('active')
}

window._goHome = () => {
  showPage('home')
  updateHero()
}

// ====== 主题 ======
function getTheme() {
  const saved = localStorage.getItem('jv_theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
    btnTheme.textContent = '☀️'
  } else {
    document.documentElement.removeAttribute('data-theme')
    btnTheme.textContent = '🌙'
  }
}

function toggleTheme() {
  const current = getTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  localStorage.setItem('jv_theme', next)
  applyTheme(next)
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('jv_theme')) {
    applyTheme(e.matches ? 'dark' : 'light')
  }
})

// ====== 今日统计 ======
function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getTodayCount() {
  const saved = localStorage.getItem('jv_todayDate')
  const today = getTodayKey()
  if (saved !== today) {
    localStorage.setItem('jv_todayDate', today)
    localStorage.setItem('jv_todayCount', '0')
    return 0
  }
  return +(localStorage.getItem('jv_todayCount') || 0)
}

function incToday() {
  const today = getTodayKey()
  localStorage.setItem('jv_todayDate', today)
  const count = +(localStorage.getItem('jv_todayCount') || 0) + 1
  localStorage.setItem('jv_todayCount', count.toString())
}

// ====== 数据加载 ======
async function loadVerbs(level) {
  if (verbCache[level]) return verbCache[level]
  const res = await fetch(`data/n${level}_verbs.json`)
  const data = await res.json()
  verbCache[level] = data.filter(v => v.conj_type)
  return verbCache[level]
}

async function loadAdjectives(level) {
  if (adjCache[level]) return adjCache[level]
  const res = await fetch(`data/n${level}_adjectives.json`)
  const data = await res.json()
  adjCache[level] = data.filter(a => a.adj_type)
  return adjCache[level]
}

function getWordCounts() { return studyMode === 'adj' ? adjCounts : verbCounts }
function getCurrentCount() { return getWordCounts()[currentLevel] || 0 }

// ====== 首页 Hero ======
function getLevelProgress(level) {
  const done = +(localStorage.getItem(`jv_levelDone_${level}`) || 0)
  const counts = getWordCounts()
  const total = (counts[level] || 1) * 3 // 3遍
  return Math.min(Math.round((done / total) * 100), 100)
}

function getTotalReview() {
  const book = JSON.parse(localStorage.getItem('jv_wrongBook') || '[]')
  return book.length
}

function updateHero() {
  heroBadge.textContent = 'N' + currentLevel
  const counts = getWordCounts()
  const count = counts[currentLevel] || 0
  const pct = getLevelProgress(currentLevel)
  const done = Math.round(pct / 100 * count * 3 / 3)
  heroProgressText.textContent = `${done} / ${count}`
  heroProgressFill.style.width = pct + '%'

  heroReview.textContent = getTotalReview()
  heroToday.textContent = getTodayCount()

  // 模式标签
  const modeLabel = $('heroModeLabel')
  if (modeLabel) {
    modeLabel.textContent = studyMode === 'adj' ? '形容词' : '动词'
  }
  const btnHero = $('btnHeroLearn')
  if (btnHero) {
    btnHero.textContent = studyMode === 'adj' ? '开始学习形容词' : '开始学习'
  }
}

async function initHome() {
  applyTheme(getTheme())

  const counts = {}
  const adjCountsObj = {}
  await Promise.all(LEVELS.map(async lv => {
    const verbs = await loadVerbs(lv)
    counts[lv] = verbs.length
    const adjs = await loadAdjectives(lv)
    adjCountsObj[lv] = adjs.length
  }))
  verbCounts = counts
  adjCounts = adjCountsObj
  updateHero()
}

function switchLevel(dir) {
  const idx = LEVELS.indexOf(currentLevel)
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= LEVELS.length) return
  currentLevel = LEVELS[newIdx]
  updateHero()
}

function toggleMode() {
  studyMode = studyMode === 'verb' ? 'adj' : 'verb'
  updateHero()
  const btn = $('btnToggleMode')
  if (btn) {
    btn.innerHTML = studyMode === 'adj'
      ? '<span class="emoji">🔀</span>切换动词'
      : '<span class="emoji">🔀</span>切换形容词'
  }
}

// ====== 学习页 ======
async function startLearnPage() {
  showPage('learn')
  bindLearnEvents()
  if (studyMode === 'adj') {
    const adjList = await loadAdjectives(currentLevel)
    await startLearn(adjList, currentLevel, 'adj')
  } else {
    const verbList = await loadVerbs(currentLevel)
    await startLearn(verbList, currentLevel, 'verb')
  }
}

// ====== 练习页 ======
async function startPractice() {
  showPage('practice')
  if (studyMode === 'adj') {
    wordList_ = await loadAdjectives(currentLevel)
  } else {
    wordList_ = await loadVerbs(currentLevel)
  }
  round = 1
  correct = 0
  correctNum.textContent = '0'
  answerInput.value = ''
  hintArea.style.display = 'none'
  resultOverlay.style.display = 'none'
  genQuestion()
  setTimeout(() => answerInput.focus(), 100)
}

function genQuestion() {
  if (wordList_.length === 0) return

  const word = wordList_[Math.floor(Math.random() * wordList_.length)]

  // 根据模式选择变形
  if (studyMode === 'adj') {
    const formKey = ADJ_QUIZ_FORMS[Math.floor(Math.random() * ADJ_QUIZ_FORMS.length)]
    const forms = conjugateAdj(word.kana, word.adj_type)
    if (!forms || !forms[formKey]) return genQuestion()

    pagePractice.dataset.correctAnswer = forms[formKey]
    pagePractice.dataset.verbWord = word.word
    pagePractice.dataset.verbKana = word.kana
    pagePractice.dataset.formKey = formKey

    quizWord.textContent = word.word
    quizKana.textContent = word.kana || ''
    quizMeaning.textContent = word.gloss_cn || ''
    quizFormName.textContent = ADJ_FORM_LABELS[formKey] || formKey
    roundNum.textContent = round
  } else {
    const formKey = QUIZ_FORMS[Math.floor(Math.random() * QUIZ_FORMS.length)]
    const forms = conjugate(word.kana, word.conj_type)
    if (!forms || !forms[formKey]) return genQuestion()

    pagePractice.dataset.correctAnswer = forms[formKey]
    pagePractice.dataset.verbWord = word.word
    pagePractice.dataset.verbKana = word.kana
    pagePractice.dataset.formKey = formKey

    quizWord.textContent = word.word
    quizKana.textContent = word.kana || ''
    quizMeaning.textContent = word.gloss_cn || ''
    quizFormName.textContent = FORM_LABELS[formKey] || formKey
    roundNum.textContent = round
  }

  answerInput.value = ''
  hintArea.style.display = 'none'
  resultOverlay.style.display = 'none'
  btnSubmit.disabled = true
}

function checkAnswer(input, answer) {
  const norm = s => s.replace(/[\s\u3000]/g, '').replace(/[A-Za-z]+/g, m => m.toLowerCase())
  return norm(input) === norm(answer)
}

function submitAnswer() {
  const input = answerInput.value.trim()
  if (!input) return

  const correctAnswer = pagePractice.dataset.correctAnswer
  const verbWord = pagePractice.dataset.verbWord
  const verbKana = pagePractice.dataset.verbKana
  const formKey = pagePractice.dataset.formKey

  const isCorrect = checkAnswer(input, correctAnswer)

  if (isCorrect) {
    correct++
    correctNum.textContent = correct
  } else {
    const book = JSON.parse(localStorage.getItem('jv_wrongBook') || '[]')
    book.push({ word: verbWord, kana: verbKana, formKey, correctAnswer, userInput: input, time: Date.now() })
    localStorage.setItem('jv_wrongBook', JSON.stringify(book.slice(-200)))
  }

  round++
  roundNum.textContent = round

  // 更新统计
  const totalDone = +(localStorage.getItem('jv_totalDone') || 0) + 1
  localStorage.setItem('jv_totalDone', totalDone.toString())
  incToday()
  const lvDone = +(localStorage.getItem(`jv_levelDone_${currentLevel}`) || 0) + 1
  localStorage.setItem(`jv_levelDone_${currentLevel}`, lvDone.toString())

  // 显示结果
  resultIcon.textContent = isCorrect ? '🎉' : '😅'
  resultMsg.textContent = isCorrect ? '正确！' : '不对哦'
  resultWord.textContent = verbWord
  resultAnswer.textContent = correctAnswer
  resultCard.className = 'result-card ' + (isCorrect ? 'correct' : 'wrong')
  resultOverlay.style.display = 'flex'

  if (!isCorrect) {
    hintArea.style.display = 'block'
    hintAnswer.textContent = correctAnswer
  }

  answerInput.blur()
}

function nextQuestion() {
  resultOverlay.style.display = 'none'
  genQuestion()
  setTimeout(() => answerInput.focus(), 100)
}

// ====== 词库页 ======
async function startWords() {
  showPage('words')
  if (studyMode === 'adj') {
    currentVerbList = await loadAdjectives(currentLevel)
  } else {
    currentVerbList = await loadVerbs(currentLevel)
  }
  searchInput.value = ''
  renderWordList(currentVerbList)
  totalWords.textContent = currentVerbList.length
  const footerLabel = $('footerLabel')
  if (footerLabel) footerLabel.textContent = studyMode === 'adj' ? '形容词' : '动词'
}

function renderWordList(list) {
  const isAdj = studyMode === 'adj'
  wordList.innerHTML = list.map(v => {
    const typeTag = isAdj ? (v.adj_type === 'i' ? 'イ形' : 'ナ形') : (v.conj_type || '-')
    const posExtra = v.pos ? ` · ${v.pos}` : ''
    return `
    <div class="word-item">
      <div class="word-main">
        <span class="word-text">${v.word}</span>
        <span class="word-kana">${v.kana || ''}</span>
      </div>
      <div class="word-info">
        <span class="word-type-tag">${typeTag}</span>
        <span class="word-meaning">${v.gloss_cn || '-'}${posExtra}</span>
      </div>
    </div>
  `}).join('')
  emptyMsg.style.display = list.length === 0 ? 'block' : 'none'
}

// ====== 统计弹窗 ======
function showStats() {
  $('mTotal').textContent = localStorage.getItem('jv_totalDone') || '0'
  $('mToday').textContent = getTodayCount()
  $('mWrong').textContent = getTotalReview()
  $('mMastered').textContent = '0'
  modalStats.style.display = 'flex'
}

// ====== 事件绑定 ======

// 首页 - Hero
btnHeroLearn.addEventListener('click', startLearnPage)
$('btnPrevLevel').addEventListener('click', () => switchLevel(-1))
$('btnNextLevel').addEventListener('click', () => switchLevel(1))
$('btnToggleMode').addEventListener('click', toggleMode)

// 快捷入口
$('btnQuickPractice').addEventListener('click', () => {
  showPage('practice')
  startPractice()
})
$('btnQuickQuiz').addEventListener('click', () => {
  showPage('practice')
  startPractice() // TODO: 测验模式入口
})

// 功能网格
$('featToday').addEventListener('click', () => { alert(`今日已练习 ${getTodayCount()} 次`) })
$('featStats').addEventListener('click', () => { showStats() })
$('featWords').addEventListener('click', startWords)
$('featLevels').addEventListener('click', () => {
  // 循环切换级别
  const idx = LEVELS.indexOf(currentLevel)
  currentLevel = LEVELS[(idx + 1) % LEVELS.length]
  updateHero()
})
$('featSettings').addEventListener('click', () => { toggleTheme() })

// 主题切换
btnTheme.addEventListener('click', toggleTheme)

// 统计弹窗
$('btnModalClose').addEventListener('click', () => { modalStats.style.display = 'none' })
modalStats.addEventListener('click', e => {
  if (e.target === modalStats) modalStats.style.display = 'none'
})

// 练习页
$('btnBackPractice').addEventListener('click', () => { showPage('home'); updateHero() })

answerInput.addEventListener('input', () => {
  btnSubmit.disabled = !answerInput.value.trim()
})

answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer()
})

btnSubmit.addEventListener('click', submitAnswer)

resultOverlay.addEventListener('click', e => {
  if (e.target === resultOverlay || e.target.closest('.result-card')) {
    nextQuestion()
  }
})

// 词库页
$('btnBackWords').addEventListener('click', () => { showPage('home'); updateHero() })

searchInput.addEventListener('input', () => {
  const kw = searchInput.value.trim().toLowerCase()
  if (!kw) { renderWordList(currentVerbList); return }
  const filtered = currentVerbList.filter(v =>
    v.word.toLowerCase().includes(kw) ||
    (v.kana && v.kana.includes(kw)) ||
    (v.gloss_cn && v.gloss_cn.includes(kw))
  )
  renderWordList(filtered)
})

// ====== 启动 ======
initHome()
