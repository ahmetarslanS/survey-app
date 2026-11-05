import { downloadFile, request } from './http'

export const surveyService = {
  /** GET /admin/surveys */
  list: () => request('/admin/surveys'),

  /** GET /admin/surveys/{id} — anketin tam içeriği (taslağı builder'da açmak için) */
  get: (id) => request(`/admin/surveys/${id}`),

  /** POST /admin/surveys/drafts — DRAFT olarak kaydeder, mail göndermez. Dönen değer: surveyId */
  createDraft: (payload) => request('/admin/surveys/drafts', { method: 'POST', body: payload }),

  /** PUT /admin/surveys/{id}/draft — taslağın tüm içeriğini günceller */
  updateDraft: (id, payload) => request(`/admin/surveys/${id}/draft`, { method: 'PUT', body: payload }),

  /** POST /admin/surveys/{id}/send — taslağı yayına alır, davetleri gönderir -> { participantCount, sentCount, failedCount, endDate } */
  send: (id) => request(`/admin/surveys/${id}/send`, { method: 'POST' }),

  /** DELETE /admin/surveys/{id} — yalnızca taslaklar */
  remove: (id) => request(`/admin/surveys/${id}`, { method: 'DELETE' }),

  /** PATCH /admin/surveys/{id}  body: { status?, endDate? } — yayındaki/süresi dolmuş anketler için */
  update: (id, payload) => request(`/admin/surveys/${id}`, { method: 'PATCH', body: payload }),

  /** GET /admin/surveys/{id}/reports */
  getReport: (id) => request(`/admin/surveys/${id}/reports`),

  exportCsv: (id) => downloadFile(`/admin/surveys/${id}/export/csv`, `anket-raporu-${id}.csv`),
  // PDF backend'de yok; önyüzde üretilir: lib/pdf/exportSurveyReportPdf
}
