/** 받침 유무에 따라 주격 조사를 고른다 (이과장이 / 김현주가) */
export function getSubjectParticle(name: string) {
  const lastCode = name.charCodeAt(name.length - 1)
  const isHangul = lastCode >= 0xac00 && lastCode <= 0xd7a3
  if (!isHangul) return '가'
  return (lastCode - 0xac00) % 28 === 0 ? '가' : '이'
}
