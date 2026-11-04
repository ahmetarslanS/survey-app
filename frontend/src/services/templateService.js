import { request } from './http'

export const templateService = {
  /** GET /admin/templates */
  list: () => request('/admin/templates'),

  /** GET /admin/templates/{id} */
  get: (id) => request(`/admin/templates/${id}`),

  /** POST /admin/templates/from-survey/{surveyId}  body: { name, description } */
  createFromSurvey: (surveyId, payload) =>
    request(`/admin/templates/from-survey/${surveyId}`, { method: 'POST', body: payload }),

  /** DELETE /admin/templates/{id} */
  remove: (id) => request(`/admin/templates/${id}`, { method: 'DELETE' }),
}
