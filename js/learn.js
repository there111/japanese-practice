import { conjugate, conjugateAdj, FORM_LABELS, FORM_EXPLANATIONS, QUIZ_FORMS, ADJ_FORM_LABELS, ADJ_FORM_EXPLANATIONS, ADJ_QUIZ_FORMS } from './conjugation.js'
import { generateFormExample, generateAdjFormExample } from './examples.js'

console.log('🔴 learn.js v5 动词+形容词模式已加载', new Date().toLocaleTimeString())

// ====== 状态 ======
let items = []            // 统一词条列表（动词或形容词）
let currentIdx = 0
let currentFormIdx = 0
let phase = 'learn'       // 'learn' | 'quiz'
let currentItem = null    // 当前词条
let currentFormKey = null
let currentCorrect = null
let _mode = 'verb'        // 'verb' | 'adj'

// ====== 发音 ======
function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

// ====== shuffle ======
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// ====== 辅助 ======
function getFormLabels() { return _mode === 'adj' ? ADJ_FORM_LABELS : FORM_LABELS }
function getFormExplanations() { return _mode === 'adj' ? ADJ_FORM_EXPLANATIONS : FORM_EXPLANATIONS }
function getQuizForms() { return _mode === 'adj' ? ADJ_QUIZ_FORMS : QUIZ_FORMS }
function getForms(item) {
  if (_mode === 'adj') return conjugateAdj(item.kana, item.adj_type)
  return conjugate(item.kana, item.conj_type)
}
function itemLabel() { return _mode === 'adj' ? '形容词' : '动词' }

// ====== 生成全部变形卡片 HTML ======
function renderFormCards(item) {
  const forms = getForms(item)
  if (!forms) return '<p>无法生成变形</p>'

  const formKeys = getQuizForms()
  const labels = getFormLabels()
  const explanations = getFormExplanations()

  return formKeys.map(key => {
    const label = labels[key] || key
    const expl = explanations[key] || {}
    const value = forms[key] || '-'
    const ex = _mode === 'adj'
      ? generateAdjFormExample(item, key, value)
      : generateFormExample(item, key, value)

    return `
      <div class="form-card">
        <div class="form-card-top">
          <span class="form-card-name">${label}</span>
          <span class="form-card-value">${value}</span>
          <button class="btn-speak-sm" data-speak="${value}">🔊</button>
        </div>
        <p class="form-card-meaning">${expl.meaning || ''}</p>
        <p class="form-card-desc">${expl.desc || ''}</p>
        <div class="form-card-example">
          <p class="fm-ex-ja">${ex.ja}</p>
          <p class="fm-ex-cn">${ex.cn}</p>
        </div>
      </div>`
  }).join('')
}

// ====== 学习阶段：展示全部变形卡片 ======
function showFormLearn() {
  phase = 'learn'

  const label = itemLabel()

  if (!items.length) {
    $('formCardsWrap').innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted)">暂无可学习的${label}，请返回首页重新选择级别。</p>`
    $('formLearnPhase').style.display = 'block'
    $('formQuizPhase').style.display = 'none'
    return
  }

  currentItem = items[currentIdx]
  if (!currentItem) {
    currentIdx = 0
    currentItem = items[0]
  }

  // 基本信息
  $('learnWord').textContent = currentItem.word
  $('learnKana').textContent = currentItem.kana || ''
  $('learnMeaning').textContent = currentItem.gloss_cn || ''

  // 词性标签（形容词专用）
  const typeEl = $('learnType')
  if (typeEl) {
    if (_mode === 'adj') {
      typeEl.textContent = currentItem.pos || ''
      typeEl.style.display = 'inline-block'
    } else {
      typeEl.style.display = 'none'
    }
  }

  // 全部变形卡片
  $('formCardsWrap').innerHTML = renderFormCards(currentItem)

  // 发音按钮
  bindSpeakBtns()

  // 进度
  $('verbIdx').textContent = currentIdx + 1
  $('verbTotal').textContent = items.length

  // 切换显示
  $('formLearnPhase').style.display = 'block'
  $('formQuizPhase').style.display = 'none'

  // 发音
  speak(currentItem.kana || currentItem.word)
}

function bindSpeakBtns() {
  $('formCardsWrap').querySelectorAll('.btn-speak-sm').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation()
      speak(btn.dataset.speak)
    }
  })
}

// ====== 进入测验 ======
function startQuiz() {
  phase = 'quiz'
  currentFormIdx = 0
  showFormQuiz()
}

// ====== 测验单个变形 ======
function showFormQuiz() {
  const quizForms = getQuizForms()
  const labels = getFormLabels()

  currentFormKey = quizForms[currentFormIdx]
  const label = labels[currentFormKey] || currentFormKey

  const forms = getForms(currentItem)
  currentCorrect = forms ? forms[currentFormKey] : null

  $('quizVerbWord').textContent = currentItem.word
  $('quizFormLabel').textContent = label
  $('quizInput').value = ''
  $('quizFeedback').style.display = 'none'
  $('quizNextBtn').style.display = 'none'
  $('quizSubmitBtn').disabled = false

  // 进度
  $('formIdx').textContent = currentFormIdx + 1
  $('formTotal').textContent = quizForms.length

  // 切换显示
  $('formLearnPhase').style.display = 'none'
  $('formQuizPhase').style.display = 'block'

  setTimeout(() => $('quizInput').focus(), 100)
}

// ====== 提交答案 ======
function onSubmitQuiz() {
  if (phase !== 'quiz') return
  const input = $('quizInput').value.trim()
  if (!input) return

  const norm = s => s.replace(/[\s\u3000]/g, '').replace(/[A-Za-z]+/g, m => m.toLowerCase())
  const isCorrect = norm(input) === norm(currentCorrect)

  $('quizSubmitBtn').disabled = true

  // 反馈
  const fb = $('quizFeedback')
  fb.style.display = 'block'
  if (isCorrect) {
    fb.className = 'quiz-feedback correct'
    fb.textContent = '✅ 正确！'
  } else {
    fb.className = 'quiz-feedback wrong'
    fb.textContent = `❌ 不对，正确答案是「${currentCorrect}」`
  }

  // 错题记录
  if (!isCorrect) {
    const book = JSON.parse(localStorage.getItem('jv_wrongBook') || '[]')
    book.push({
      word: currentItem.word,
      kana: currentItem.kana,
      formKey: currentFormKey,
      correctAnswer: currentCorrect,
      userInput: input,
      time: Date.now(),
    })
    localStorage.setItem('jv_wrongBook', JSON.stringify(book.slice(-200)))
  }

  // 统计
  const today = new Date().toISOString().split('T')[0]
  localStorage.setItem('jv_todayDate', today)
  const todayCount = +(localStorage.getItem('jv_todayCount') || 0) + 1
  localStorage.setItem('jv_todayCount', todayCount.toString())
  const totalDone = +(localStorage.getItem('jv_totalDone') || 0) + 1
  localStorage.setItem('jv_totalDone', totalDone.toString())
  const lvDone = +(localStorage.getItem(`jv_levelDone_${_level}`) || 0) + 1
  localStorage.setItem(`jv_levelDone_${_level}`, lvDone.toString())

  // 显示继续按钮
  currentFormIdx++
  const allDone = currentFormIdx >= getQuizForms().length
  $('quizNextBtn').style.display = 'block'
  $('quizNextBtn').textContent = allDone ? `下一个${itemLabel()} →` : '下一个变形 →'
}

// ====== 下一步 ======
function nextStep() {
  if (currentFormIdx >= getQuizForms().length) {
    currentIdx++
    if (currentIdx >= items.length) {
      currentIdx = 0
      shuffle(items)
    }
    showFormLearn()
  } else {
    showFormQuiz()
  }
}

// ====== 入口 ======
let _level = 5

export function getLevel() { return _level }
export function getMode() { return _mode }

export async function startLearn(wordList, level, mode = 'verb') {
  _level = level
  _mode = mode
  items = [...wordList]
  shuffle(items)
  currentIdx = 0
  currentFormIdx = 0
  currentItem = null
  currentFormKey = null
  currentCorrect = null

  showFormLearn()
}

// ====== DOM 绑定 ======
export function bindLearnEvents() {
  $('btnAudio').onclick = () => {
    if (currentItem) speak(currentItem.kana || currentItem.word)
  }
  $('btnToQuiz').onclick = () => startQuiz()
  $('btnBackLearn').onclick = () => window._goHome()
  $('quizSubmitBtn').onclick = () => onSubmitQuiz()
  $('quizNextBtn').onclick = () => nextStep()
  $('quizInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') onSubmitQuiz()
  })
}

const $ = id => document.getElementById(id)
