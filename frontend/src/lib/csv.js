const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (value) => EMAIL_RE.test(value)

/**
 * Katılımcı CSV'sini ayrıştırır (FR-41). İlk satır "email" başlığı olabilir; ayraç , veya ;.
 * @param {string} text
 * @param {string[]} existing  Listede zaten bulunan adresler (küçük harf)
 * @returns {{ valid: string[], errors: { line: number, value: string, reason: string }[], total: number }}
 */
export function parseParticipantCsv(text, existing = []) {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
  const seen = new Set(existing.map((e) => e.toLowerCase()))
  const valid = []
  const errors = []
  let total = 0

  let emailCol = 0
  let start = 0
  if (lines.length) {
    const header = lines[0].split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase())
    const idx = header.findIndex((c) => ['email', 'e-mail', 'eposta', 'e-posta', 'mail'].includes(c))
    if (idx !== -1) {
      emailCol = idx
      start = 1
    }
  }

  for (let i = start; i < lines.length; i++) {
    if (!lines[i]) continue
    total++
    const cells = lines[i].split(/[;,]/)
    const value = (cells[emailCol] ?? '').trim().replace(/^"|"$/g, '').toLowerCase()
    if (!isValidEmail(value)) {
      errors.push({ line: i + 1, value, reason: 'Geçersiz e-posta formatı' })
    } else if (seen.has(value)) {
      errors.push({ line: i + 1, value, reason: 'Tekrarlanan adres' })
    } else {
      seen.add(value)
      valid.push(value)
    }
  }
  return { valid, errors, total }
}

export function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
  // UTF-8 BOM: Excel'de Türkçe karakterlerin korunması için
  const blob = new Blob(['﻿', content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadParticipantTemplate = () =>
  downloadTextFile('katilimci-sablonu.csv', 'email\r\nornek1@firma.com\r\nornek2@firma.com\r\n')
