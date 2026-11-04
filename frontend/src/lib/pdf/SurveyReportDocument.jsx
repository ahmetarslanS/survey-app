import interBold from '@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'
import interRegular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'
import interSemiBold from '@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { QUESTION_TYPES, SURVEY_STATUS } from '@/lib/constants'
import { formatDateTime, formatPercent, formatScore } from '@/lib/format'

// Standart PDF fontları Türkçe karakterleri (ğ, ş, ı, İ) içermediği için Inter gömülür
Font.register({
  family: 'Inter',
  fonts: [
    { src: interRegular, fontWeight: 400 },
    { src: interSemiBold, fontWeight: 600 },
    { src: interBold, fontWeight: 700 },
  ],
})
// Uzun kelimeler satır sonunda tireyle bölünmesin
Font.registerHyphenationCallback((word) => [word])

const C = {
  primary: '#1E4FD8',
  primarySoft: '#E7EDFC',
  text: '#101828',
  muted: '#667085',
  subtle: '#98A2B3',
  border: '#E4E7EC',
  track: '#F2F4F7',
  freeBg: '#F9FAFB',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9.5, color: C.text, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40 },
  brand: { fontSize: 8, color: C.primary, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  description: { color: C.muted, marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  meta: { color: C.muted, marginRight: 14, fontSize: 8.5 },
  kpis: { flexDirection: 'row', marginBottom: 18 },
  kpi: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, marginRight: 8 },
  kpiLast: { marginRight: 0 },
  kpiHero: { backgroundColor: C.primary, borderColor: C.primary },
  kpiLabel: { fontSize: 7.5, color: C.muted, marginBottom: 6 },
  kpiValue: { fontSize: 15, fontWeight: 700 },
  kpiHint: { fontSize: 7, color: C.muted, marginTop: 3 },
  anonNote: { fontSize: 8, color: C.muted, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  qTitleWrap: { flex: 1, paddingRight: 12 },
  qTitle: { fontSize: 10.5, fontWeight: 600 },
  qMeta: { fontSize: 8, color: C.muted, marginTop: 3 },
  avgWrap: { alignItems: 'flex-end' },
  avg: { fontSize: 15, fontWeight: 700, color: C.primary },
  avgLabel: { fontSize: 7, color: C.muted },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  barLabel: { width: 150, fontSize: 8.5, paddingRight: 8 },
  barTrack: { flex: 1, height: 11, backgroundColor: C.track, borderRadius: 3 },
  barFill: { height: 11, backgroundColor: C.primary, borderRadius: 3 },
  barValue: { width: 70, textAlign: 'right', fontSize: 8.5, color: C.muted },
  barValueStrong: { color: C.text, fontWeight: 600 },
  freeSection: { marginTop: 4, marginBottom: 10, paddingHorizontal: 2 },
  // Arka plan/çerçeve View'da: Text'e padding + lineHeight verilince react-pdf altta boş satır bırakıyor
  freeItem: { backgroundColor: C.freeBg, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 5 },
  empty: { fontSize: 8.5, color: C.subtle },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: C.subtle },
})

function Kpi({ label, value, hint, hero, last }) {
  return (
    <View style={[s.kpi, hero && s.kpiHero, last && s.kpiLast]}>
      <Text style={[s.kpiLabel, hero && { color: '#C7D5FA' }]}>{label}</Text>
      <Text style={[s.kpiValue, hero && { color: '#FFFFFF' }]}>{value}</Text>
      {hint ? <Text style={[s.kpiHint, hero && { color: '#C7D5FA' }]}>{hint}</Text> : null}
    </View>
  )
}

function Bars({ options, likert }) {
  const sorted = [...options].sort((a, b) => (a.answerOrder ?? 0) - (b.answerOrder ?? 0))
  const max = Math.max(1, ...sorted.map((o) => o.selectedCount ?? 0))
  if (sorted.length === 0) return <Text style={s.empty}>Seçenek yok.</Text>
  return sorted.map((o, k) => (
    <View key={o.answerId ?? k} style={s.barRow} wrap={false}>
      <Text style={s.barLabel}>{o.text}</Text>
      <View style={s.barTrack}>
        <View
          style={[
            s.barFill,
            {
              width: `${((o.selectedCount ?? 0) / max) * 100}%`,
              opacity: likert ? 0.35 + (k / Math.max(1, sorted.length - 1)) * 0.65 : 1,
            },
          ]}
        />
      </View>
      <Text style={s.barValue}>
        <Text style={s.barValueStrong}>{o.selectedCount ?? 0}</Text> · {formatPercent(o.selectedRate)}
      </Text>
    </View>
  ))
}

function QuestionHead({ q, index }) {
  return (
    <View style={s.cardHead}>
      <View style={s.qTitleWrap}>
        <Text style={s.qTitle}>
          {index + 1}. {q.questionText}
        </Text>
        <Text style={s.qMeta}>
          {QUESTION_TYPES[q.type]?.label ?? q.type} · {q.answeredCount ?? 0} yanıt ({formatPercent(q.answeredRate)})
          {q.isOptional ? ' · Opsiyonel' : ''}
        </Text>
      </View>
      {q.type === 'LIKERT' && q.averageScore != null ? (
        <View style={s.avgWrap}>
          <Text style={s.avg}>{formatScore(q.averageScore)}</Text>
          <Text style={s.avgLabel}>Ortalama / 5</Text>
        </View>
      ) : null}
    </View>
  )
}

function QuestionCard({ q, index }) {
  if (q.type === 'FREETEXT') {
    // Serbest metin listesi sayfalara bölünebilir. Çerçeveli kart bölününce sonraki sayfaya yalnızca alt kenar
    // taşabildiği için dış çerçeve yok; başlık sayfa sonunda yalnız kalmaz (minPresenceAhead).
    const answers = q.freeTextAnswers ?? []
    return (
      <View style={s.freeSection}>
        <View wrap={false} minPresenceAhead={40}>
          <QuestionHead q={q} index={index} />
        </View>
        {answers.length ? (
          answers.map((text, i) => (
            <View key={i} style={s.freeItem} wrap={false}>
              <Text>{text}</Text>
            </View>
          ))
        ) : (
          <Text style={s.empty}>Henüz yanıt yok.</Text>
        )}
      </View>
    )
  }

  // Seçimli soru kartları sayfa arasında bölünmez
  return (
    <View style={s.card} wrap={false}>
      <QuestionHead q={q} index={index} />
      <Bars options={q.options ?? []} likert={q.type === 'LIKERT'} />
    </View>
  )
}

/** Rapor ekranındaki verinin (GET /admin/surveys/{id}/reports) PDF hali (FR-73) */
export function SurveyReportDocument({ report, generatedAt }) {
  const questions = [...(report.questionReports ?? [])].sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0))
  const waiting = Math.max(0, (report.participantCount ?? 0) - (report.responseCount ?? 0))

  return (
    <Document title={`${report.title} — Anket Raporu`} author="Survey Tool" creator="Survey Tool" language="tr">
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>SURVEY TOOL · ANKET RAPORU</Text>
        <Text style={s.title}>{report.title}</Text>
        {report.description ? <Text style={s.description}>{report.description}</Text> : null}
        <View style={s.metaRow}>
          <Text style={s.meta}>Durum: {SURVEY_STATUS[report.status]?.label ?? report.statusDescription ?? '—'}</Text>
          <Text style={s.meta}>Bitiş: {formatDateTime(report.endDate)}</Text>
          <Text style={s.meta}>Rapor tarihi: {formatDateTime(generatedAt)}</Text>
        </View>

        <View style={s.kpis} wrap={false}>
          <Kpi hero label="Memnuniyet Ortalaması" value={formatScore(report.satisfactionAverage)} hint="5 üzerinden" />
          <Kpi label="Katılım Oranı" value={formatPercent(report.participationRate)} />
          <Kpi
            label="Davet / Yanıt"
            value={`${report.participantCount ?? 0} / ${report.responseCount ?? 0}`}
            hint={`${waiting} kişi bekleniyor`}
          />
          <Kpi last label="Ort. Tamamlama" value={report.averageCompletionTimeText ?? '—'} />
        </View>

        {report.isAnonymous ? (
          <Text style={s.anonNote}>Anonim anket · kişi bazlı yanıt gösterilmez</Text>
        ) : null}

        {questions.length === 0 ? <Text style={s.empty}>Bu ankette soru bulunmuyor.</Text> : null}
        {questions.map((q, i) => (
          <QuestionCard key={q.questionId ?? i} q={q} index={i} />
        ))}

        <View style={s.footer} fixed>
          <Text>{report.title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
