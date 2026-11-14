// Speech-to-text (Whisper) and sentiment, fully in the browser, in a Web Worker
// so the game stays smooth. Models download once, then come from the cache.
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;   // models come from the Hugging Face hub (then cached)

let asr = null, sentiment = null, loading = null;
const progress = {};            // file → [loaded, total]

function onProgress(p) {
  if (p.status !== 'progress' || !p.total) return;
  progress[p.file] = [p.loaded, p.total];
  const [l, t] = Object.values(progress).reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  self.postMessage({ type: 'progress', pct: Math.round((100 * l) / t) });
}

async function load() {
  if (!loading) {
    loading = (async () => {
      sentiment = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { dtype: 'q8', progress_callback: onProgress });
      self.postMessage({ type: 'sentiment-ready' });
      asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en',
        { dtype: 'q8', progress_callback: onProgress });
      self.postMessage({ type: 'ready' });
    })();
    loading.catch((e) => { loading = null; self.postMessage({ type: 'error', message: String(e?.message || e) }); });
  }
  return loading;
}

async function valenceOf(text) {
  if (!sentiment || !text.trim()) return null;
  const [s] = await sentiment(text);
  return s.label === 'POSITIVE' ? s.score : -s.score;       // -1 … +1
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') await load();

    if (data.type === 'transcribe') {                      // Float32Array, 16 kHz mono
      if (!asr) await load();
      const { text } = await asr(data.audio, { chunk_length_s: 30 });
      const clean = (text || '').replace(/\[(BLANK_AUDIO|MUSIC|NOISE)[^\]]*\]/gi, '').trim();
      self.postMessage({ type: 'result', id: data.id, text: clean, valence: await valenceOf(clean) });
    }

    if (data.type === 'sentiment') {                       // typed text
      self.postMessage({ type: 'result', id: data.id, text: data.text, valence: await valenceOf(data.text) });
    }
  } catch (e) {
    self.postMessage({ type: 'error', id: data.id, message: String(e?.message || e) });
  }
};
