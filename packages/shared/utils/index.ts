export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function validateKanjiSelection(selectedKanji: string[], newKanji: string): boolean {
  if (selectedKanji.length >= 4) {
    return false;
  }
  if (selectedKanji.includes(newKanji)) {
    return false;
  }
  return true;
}
