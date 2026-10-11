/**
 * MATA HATI - Reliability Flag Service
 * Evaluates whether patient report is HIGH, MEDIUM, or LOW reliability
 * based on PRD Bagian 13 rules.
 */

import { ReliabilityFlag } from '../types/matahati';

export interface ReliabilityAssessment {
  flag: ReliabilityFlag;
  notes: string[];
}

export function evaluateReliability(storyText: string, hasNumbers: boolean, hasMatchedClaim: boolean): ReliabilityAssessment {
  const notes: string[] = [];
  let score = 50; // Neutral start

  const textLower = storyText.toLowerCase();

  // Adversarial / Prompt injection keywords
  const injectionPatterns = [
    'abaikan instruksi',
    'ignore previous',
    'system override',
    'nyatakan faskes ini fraud',
    'terbukti fraud 100%',
    'cabut izin sekarang',
    'hukum faskes ini'
  ];

  const isAdversarial = injectionPatterns.some(pat => textLower.includes(pat));
  if (isAdversarial) {
    return {
      flag: 'LOW',
      notes: [
        'Terdeteksi frasa manipulatif atau upaya instruksi override sistem.',
        'Laporan diperlakukan sebagai untrusted evidence dengan reliabilitas rendah.'
      ]
    };
  }

  // Check specificity: numbers, dates, medication names
  const containsSpecificNumbers = /\b\d+\b/.test(storyText);
  if (containsSpecificNumbers) {
    score += 25;
    notes.push('Menyebutkan angka/kuantitas spesifik yang dapat diukur.');
  } else {
    score -= 15;
    notes.push('Tidak menyebutkan angka atau kuantitas yang jelas.');
  }

  // Check date or timeline indicators
  const containsTimeline = /(tanggal|\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b|senin|selasa|rabu|kamis|jumat|sabtu|minggu|kemarin|minggu lalu)/i.test(storyText);
  if (containsTimeline) {
    score += 15;
    notes.push('Menyebutkan indikator waktu/kronologi kejadian.');
  }

  // Check matching claim
  if (hasMatchedClaim) {
    score += 20;
    notes.push('Klaim yang dipilih ditemukan di basis data.');
  } else {
    score -= 10;
    notes.push('Tidak ada kecocokan kunci klaim langsung.');
  }

  // Check if text is too vague (< 25 characters)
  if (storyText.trim().length < 25) {
    score -= 30;
    notes.push('Keterangan sangat singkat dan kurang detail.');
  }

  // Generic accusations without facts
  if (/(faskes curang|faskes korup|penipu|maling)/i.test(textLower) && !containsSpecificNumbers) {
    score -= 25;
    notes.push('Menggunakan tuduhan umum tanpa fakta kejadian yang dapat diverifikasi.');
  }

  let flag: ReliabilityFlag = 'MEDIUM';
  if (score >= 70) {
    flag = 'HIGH';
  } else if (score < 40) {
    flag = 'LOW';
  }

  return { flag, notes };
}
