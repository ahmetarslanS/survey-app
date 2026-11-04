import { downloadFile, request } from './http'

export const surveyService = {
  /** GET /admin/surveys */
  list: () => request('/admin/surveys'),

  /** POST /admin/surveys — anketi LIVE olarak oluşturur ve davet e-postalarını gönderir. Dönen değer: surveyId */
  create: (payload) => request('/admin/surveys', { method: 'POST', body: payload }),

  /** PATCH /admin/surveys/{id}  body: { status?, endDate? } */
  update: (id, payload) => request(`/admin/surveys/${id}`, { method: 'PATCH', body: payload }),

  /** GET /admin/surveys/{id}/reports */
  getReport: (id) => request(`/admin/surveys/${id}/reports`),

  exportCsv: (id) => downloadFile(`/admin/surveys/${id}/export/csv`, `anket-raporu-${id}.csv`),
  // PDF backend'de yok; önyüzde üretilir: lib/pdf/exportSurveyReportPdf
}
