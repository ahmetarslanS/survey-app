import { ApiError, request } from './http'

// Backend ErrorResponse.code -> /access-error?reason=
const REASON_BY_CODE = {
  INVITATION_INVALID: 'invalid',
  SURVEY_EXPIRED: 'expired',
  ALREADY_ANSWERED: 'answered',
}

function withReason(error) {
  if (error instanceof ApiError) {
    const reason = REASON_BY_CODE[error.data?.code]
    if (reason) error.reason = reason
  }
  return error
}

const tokenHeader = (token) => ({ 'X-Survey-Token': token })

/** GET /user/surveys/{id} cevabı -> formun kullandığı ortak model. Ardışık aynı sectionTitle'lı sorular bir bölümdür. */
function normalizeSurvey(raw) {
  const sections = []
  for (const q of [...(raw.questions ?? [])].sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))) {
    const title = q.sectionTitle ?? null
    let section = sections.at(-1)
    if (!section || section.title !== title) {
      section = { id: `s${sections.length}`, title, questions: [] }
      sections.push(section)
    }
    section.questions.push({
      id: String(q.questionId),
      text: q.questionText,
      type: q.type,
      mandatory: Boolean(q.isMandatory),
      options: (q.options ?? []).map((o) => ({ id: o.answerId, order: o.answerOrder, text: o.text })),
    })
  }
  return {
    id: String(raw.surveyId),
    title: raw.title,
    description: raw.description,
    endDate: raw.endDate,
    isAnonymous: Boolean(raw.isAnonymous),
    sections,
    draftAnswers: raw.draftAnswers && typeof raw.draftAnswers === 'object' ? raw.draftAnswers : null,
  }
}

/**
 * Formdaki yanıtları (value: seçenek order'ı / order dizisi / metin) backend'in beklediği
 * { questionId, optionIds | text } biçimine çevirir. Boş opsiyonel sorular gönderilmez.
 */
export function buildSubmitPayload(survey, answers, isEmpty) {
  const payload = []
  for (const q of survey.sections.flatMap((s) => s.questions)) {
    const value = answers[q.id]
    if (isEmpty(value)) continue
    if (q.type === 'FREETEXT') {
      payload.push({ questionId: Number(q.id), text: value.trim() })
    } else {
      const orders = q.type === 'MULTIPLE_CHOICE' ? value : [value]
      const optionIds = orders.map((order) => q.options.find((o) => o.order === order)?.id).filter((id) => id != null)
      payload.push({ questionId: Number(q.id), optionIds })
    }
  }
  return payload
}

export const participantService = {
  /** Token ile anketi ve varsa ara kayıttaki yanıtları getirir. */
  async getSurvey(surveyId, token) {
    try {
      const raw = await request(`/user/surveys/${surveyId}`, { headers: tokenHeader(token), auth: false })
      return normalizeSurvey(raw)
    } catch (e) {
      throw withReason(e)
    }
  },

  /** PUT /user/surveys/{id}/draft — ara kayıt (FR-63) */
  async saveDraft(surveyId, token, answers) {
    try {
      await request(`/user/surveys/${surveyId}/draft`, {
        method: 'PUT',
        body: answers,
        headers: tokenHeader(token),
        auth: false,
      })
    } catch (e) {
      throw withReason(e)
    }
  },

  /** POST /user/surveys/{id}/responses — nihai gönderim, token tüketilir */
  async submit(surveyId, token, answers) {
    try {
      await request(`/user/surveys/${surveyId}/responses`, {
        method: 'POST',
        body: { answers },
        headers: tokenHeader(token),
        auth: false,
      })
    } catch (e) {
      throw withReason(e)
    }
  },
}
