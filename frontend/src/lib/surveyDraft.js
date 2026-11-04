import { CHOICE_TYPES, LIKERT_LABELS } from './constants'
import { isFutureDateTime, toLocalDateTime } from './format'

const DRAFT_KEY = 'survey-tool.builder-draft'
const PREVIEW_KEY = 'survey-tool.preview'

export const newId = () => crypto.randomUUID()

export function createEmptyDraft() {
  return {
    title: '',
    description: '',
    endDate: '',
    endTime: '18:00',
    anonymous: true,
    participants: [],
    // FR-21: varsayılan bölüm otomatik oluşturulur
    sections: [{ id: newId(), title: 'Genel', questions: [] }],
  }
}

/**
 * GET /admin/templates/{id} cevabını builder taslağına çevirir (FR-12): başlık, açıklama ve sorular kopyalanır,
 * katılımcı ve bitiş tarihi boş gelir. Şablon bölüm tutmadığı için sorular tek bölüme yüklenir.
 */
export function templateToDraft(template) {
  const draft = createEmptyDraft()
  draft.title = template.name ?? ''
  draft.description = template.description ?? ''
  draft.anonymous = template.isAnonymous ?? true
  draft.sections[0].questions = [...(template.questionList ?? [])]
    .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
    .map((q) => ({
      id: newId(),
      text: q.questionText ?? '',
      type: q.type,
      mandatory: !q.isOptional,
      options: CHOICE_TYPES.includes(q.type)
        ? [...(q.answerList ?? [])].sort((a, b) => (a.answerOrder ?? 0) - (b.answerOrder ?? 0)).map((a) => a.text)
        : [],
    }))
  return draft
}

export const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? null
  } catch {
    return null
  }
}
export const saveDraft = (draft) => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
export const clearDraft = () => localStorage.removeItem(DRAFT_KEY)

export const allQuestions = (draft) => draft.sections.flatMap((s) => s.questions)

/** Taslağı backend'in CreateSurveyRequest gövdesine çevirir. Backend bölüm tutmadığı için sorular sıralı düzleştirilir. */
export function toCreateRequest(draft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    endDate: toLocalDateTime(draft.endDate, draft.endTime),
    isAnonymous: draft.anonymous,
    participantMails: draft.participants,
    questionList: allQuestions(draft).map((q, i) => ({
      questionText: q.text.trim(),
      type: q.type,
      questionOrder: i + 1,
      isOptional: !q.mandatory,
      ...(CHOICE_TYPES.includes(q.type)
        ? { answerList: q.options.map((text, k) => ({ answerOrder: k + 1, text: text.trim() })) }
        : {}),
    })),
  }
}

export function validateDraft(draft) {
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
    endDate: toLocalDateTime(draft.endDate || '', draft.endTime),
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

export const savePreview = (draft) => sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(toFormSurvey(draft)))
export const loadPreview = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PREVIEW_KEY))
  } catch {
    return null
  }
}
