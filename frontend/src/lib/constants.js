export const QUESTION_TYPES = {
  LIKERT: { label: 'Likert', chip: 'bg-[#E7EDFC] text-[#1E40AF]' },
  SINGLE_CHOICE: { label: 'Tekli Seçim', chip: 'bg-[#F4EBFF] text-[#6941C6]' },
  MULTIPLE_CHOICE: { label: 'Çoklu Seçim', chip: 'bg-[#FFF4ED] text-[#B93815]' },
  FREETEXT: { label: 'Serbest Metin', chip: 'bg-[#E6F6F4] text-[#0E7C6B]' },
}

export const CHOICE_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']

export const LIKERT_LABELS = [
  'Kesinlikle Katılmıyorum',
  'Katılmıyorum',
  'Normal',
  'Katılıyorum',
  'Kesinlikle Katılıyorum',
]

// Backend SurveyStatus: DRAFT, LIVE, CLOSED, OUTDATED
export const SURVEY_STATUS = {
  DRAFT: { label: 'Taslak', variant: 'secondary' },
  LIVE: { label: 'Yayında', variant: 'default' },
  OUTDATED: { label: 'Süresi Doldu', variant: 'warning' },
  CLOSED: { label: 'Kapandı', variant: 'success' },
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tüm durumlar' },
  ...Object.entries(SURVEY_STATUS).map(([value, { label }]) => ({ value, label })),
]
