// A small keyword valence used only until the sentiment model has downloaded
// (or if it can't load). Returns -1 … +1, or null when it can't tell.
const POS = ['good', 'great', 'happy', 'nice', 'better', 'fun', 'love', 'excited', 'calm', 'okay', 'fine', 'glad', 'proud', 'relaxed'];
const NEG = ['sad', 'tired', 'bad', 'awful', 'lonely', 'alone', 'stressed', 'anxious', 'worried', 'cry', 'angry', 'upset', 'hurt', 'heavy', 'exhausted', 'hate', 'scared'];

export function quickValence(text) {
  const words = String(text || '').toLowerCase().match(/[a-z']+/g) || [];
  let score = 0;
  words.forEach((w, i) => {
    const neg = words[i - 1] === 'not' || words[i - 1] === "don't" || words[i - 1] === 'never';
    if (POS.includes(w)) score += neg ? -1 : 1;
    if (NEG.includes(w)) score += neg ? 0.5 : -1;
  });
  if (!score) return null;
  return Math.max(-1, Math.min(1, score / 2));
}
