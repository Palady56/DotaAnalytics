import type { Passport } from "@/lib/passport";
import { formatNumber, formatPercent } from "@/lib/stats";

function recordBits(section: Passport["record"], label: string): string {
  if (!section.ok) return `${label}: срез не прочитан`;
  const n = section.data.wins + section.data.losses;
  return `${label}: ${formatPercent(section.data.winRate)} при n=${formatNumber(n)}`;
}

export function passportBlurb(passport: Passport): string {
  const bucket = passport.patch.bucketName ?? "неизвестен";
  const letter = passport.patch.letter ?? "не прочитана";
  return `${passport.profile.persona}. ${recordBits(passport.record, "Значимые матчи")}. ${recordBits(passport.patchRecord, `Патч ${bucket}`)}. Буква ${letter} в этот процент не входит.`;
}

export function compareBlurb(left: Passport, right: Passport): string {
  return `${left.profile.persona} и ${right.profile.persona}. ${recordBits(left.record, "Значимые первого")}. ${recordBits(right.record, "Значимые второго")}. Это сравнение профилей, не дуэт.`;
}
