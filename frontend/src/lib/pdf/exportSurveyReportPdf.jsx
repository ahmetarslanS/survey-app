const pad = (n) => String(n).padStart(2, '0')

/**
 * Rapor verisinden PDF üretip indirir (FR-73). @react-pdf/renderer büyük bir paket olduğu için
 * yalnızca butona basıldığında yüklenir; ana bundle'a girmez.
 */
export async function exportSurveyReportPdf(report) {
  const [{ pdf }, { SurveyReportDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./SurveyReportDocument'),
  ])

  const now = new Date()
  const blob = await pdf(<SurveyReportDocument report={report} generatedAt={now} />).toBlob()

  // Backend CSV dosya adıyla aynı biçim: anket-raporu-1-20261104-1530.pdf
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `anket-raporu-${report.surveyId}-${stamp}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
