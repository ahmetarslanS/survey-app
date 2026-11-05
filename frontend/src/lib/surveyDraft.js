import { CHOICE_TYPES, LIKERT_LABELS } from './constants'
import { isFutureDateTime, splitLocalDateTime, toLocalDateTime } from './format'

// Önizleme yeni sekmede açılır; sekmeler arası paylaşım için localStorage kullanılır
const PREVIEW_KEY = 'survey-tool.preview'

export const newId = () => crypto.randomUUID()

const DEFAULT_SECTION_TITLE = 'Genel'

export function createEmptyDraft() {
  return {
    title: '',
    description: '',
    endDate: '',
    endTime: '18:00',
    anonymous: true,
    participants: [],
    // FR-21: varsayılan bölüm otomatik oluşturulur
    sections: [{ id: newId(), title: DEFAULT_SECTION_TITLE, questions: [] }],
  }
}

const sortByOrder = (key) => (a, b) => (a[key] ?? 0) - (b[key] ?? 0)

/**
 * GET /admin/templates/{id} cevabını builder taslağına çevirir (FR-12): başlık, açıklama ve sorular kopyalanır,
 * katılımcı ve bitiş tarihi boş gelir. Şablon bölüm tutmadığı için sorular tek bölüme yüklenir.
 */
export function templateToDraft(template) {
  const draft = createEmptyDraft()
  draft.title = template.name ?? ''
  draft.description = template.description ?? ''
  draft.anonymous = template.isAnonymous ?? true
  draft.sections[0].questions = [...(template.questionList ?? [])].sort(sortByOrder('questionOrder')).map((q) => ({
    id: newId(),
    text: q.questionText ?? '',
    type: q.type,
    mandatory: !q.isOptional,
    options: CHOICE_TYPES.includes(q.type) ? [...(q.answerList ?? [])].sort(sortByOrder('answerOrder')).map((a) => a.text) : [],
  }))
  return draft
}

/**
 * GET /admin/surveys/{id} cevabını (SurveyDetailResponse) builder taslağına çevirir.
 * Bölümler, soruların sectionTitle alanından sıraları korunarak yeniden kurulur.
 */
export function detailToDraft(detail) {
  const { date, time } = splitLocalDateTime(detail.endDate)
  const sections = []
  for (const q of [...(detail.questions ?? [])].sort(sortByOrder('questionOrder'))) {
    const title = q.sectionTitle || DEFAULT_SECTION_TITLE
    let section = sections.at(-1)
    if (!section || section.title !== title) {
      section = { id: newId(), title, questions: [] }
      sections.push(section)
    }
    section.questions.push({
      id: newId(),
      text: q.questionText ?? '',
      type: q.type,
      mandatory: !q.isOptional,
      options: CHOICE_TYPES.includes(q.type) ? [...(q.options ?? [])].sort(sortByOrder('answerOrder')).map((o) => o.text) : [],
    })
  }
  return {
    title: detail.title ?? '',
    description: detail.description ?? '',
    endDate: date,
    endTime: time || '18:00',
    anonymous: detail.isAnonymous ?? true,
    participants: detail.participantMails ?? [],
    sections: sections.length ? sections : createEmptyDraft().sections,
  }
}

export const allQuestions = (draft) => draft.sections.flatMap((s) => s.questions)

/**
 * Taslağı backend'in CreateSurveyRequest gövdesine çevirir. Sorular sıralı düzleştirilir; bölüm bilgisi
 * her sorunun sectionTitle alanında taşınır. Taslakta bitiş tarihi boş olabilir.
 */
export function toCreateRequest(draft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    endDate: draft.endDate ? toLocalDateTime(draft.endDate, draft.endTime || '00:00') : null,
    isAnonymous: draft.anonymous,
    participantMails: draft.participants,
    questionList: draft.sections.flatMap((section) => section.questions.map((q) => ({ q, sectionTitle: section.title }))).map(
      ({ q, sectionTitle }, i) => ({
        questionText: q.text.trim(),
        type: q.type,
        questionOrder: i + 1,
        isOptional: !q.mandatory,
        sectionTitle: sectionTitle?.trim() || null,
        ...(CHOICE_TYPES.includes(q.type)
          ? { answerList: q.options.map((text, k) => ({ answerOrder: k + 1, text: text.trim() })) }
          : {}),
      }),
    ),
  }
}

/** Taslak olarak kaydetmek için yalnızca başlık gerekir (listede görünmesi için). */
export function validateForSave(draft) {
  return draft.title.trim() ? [] : ['Taslağı kaydetmek için anket başlığı girin.']
}

/** Göndermek için anket eksiksiz olmalı (FR-20, FR-22, FR-40). */
export function validateForSend(draft) {
  const errors = []
  if (!draft.title.trim()) errors.push('Anket başlığı zorunludur.')
  if (!draft.endDate) errors.push('Bitiş tarihi zorunludur.')
  else if (!isFutureDateTime(draft.endDate, draft.endTime)) errors.push('Bitiş tarihi geçmiş bir tarih olamaz.')
  if (allQuestions(draft).length === 0) errors.push('En az bir soru eklemelisiniz.')
  if (draft.participants.length === 0) errors.push('En az bir katılımcı eklemelisiniz.')
  return errors
}

/** Katılımcı formu bileşeninin beklediği ortak anket modeli */
export function toFormSurvey(draft) {
  return {
    id: 'preview',
    title: draft.title || 'Başlıksız anket',
    description: draft.description,
    endDate: draft.endDate ? toLocalDateTime(draft.endDate, draft.endTime) : null,
    isAnonymous: draft.anonymous,
    sections: draft.sections
      .filter((s) => s.questions.length)
      .map((s) => ({
        id: s.id,
        title: s.title,
        questions: s.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          mandatory: q.mandatory,
          options:
            q.type === 'LIKERT'
              ? LIKERT_LABELS.map((text, i) => ({ order: i + 1, text }))
              : (q.options ?? []).map((text, i) => ({ order: i + 1, text })),
        })),
      })),
  }
}

export const savePreview = (draft) => localStorage.setItem(PREVIEW_KEY, JSON.stringify(toFormSurvey(draft)))
export const loadPreview = () => {
  try {
    return JSON.parse(localStorage.getItem(PREVIEW_KEY))
  } catch {
    return null
  }
}
