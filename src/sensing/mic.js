// Tap-to-talk recording + loudness. Audio stays in memory and is discarded
// right after transcription — never stored, never sent.
let stream = null, ctx = null, analyser = null, recorder = null, chunks = [], levels = [], levelTimer = 0;

export const micReady = () => !!(stream && stream.active);

export async function initMic() {
  if (micReady()) return;
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume();
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
}

/** Current loudness (RMS, 0…~0.3), for the little listening ring. */
export function liveLevel() {
  if (!analyser) return 0;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  return Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
}

export function startRecording() {
  if (!micReady()) throw new Error('mic not ready');
  chunks = []; levels = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.start();
  clearInterval(levelTimer);
  levelTimer = setInterval(() => {                       // loudness samples
    if (!recorder || recorder.state !== 'recording') return clearInterval(levelTimer);
    levels.push(liveLevel());
  }, 100);
}

export const isRecording = () => !!(recorder && recorder.state === 'recording');

/** Resolves { audio: Float32Array (16 kHz mono), loudness, seconds } or null if nothing was said. */
export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!isRecording()) return resolve(null);
    recorder.onstop = async () => {
      clearInterval(levelTimer);
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        chunks = [];
        if (!blob.size) return resolve(null);
        const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
        // Whisper needs 16 kHz mono. OfflineAudioContext resampling works on iOS Safari too.
        const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000);
        const src = off.createBufferSource();
        src.buffer = decoded; src.connect(off.destination); src.start();
        const rendered = await off.startRendering();
        const loudness = levels.reduce((a, b) => a + b, 0) / Math.max(levels.length, 1);
        resolve({ audio: rendered.getChannelData(0), loudness, seconds: decoded.duration });
      } catch (e) { reject(e); }
    };
    recorder.stop();
  });
}

export function stopMic() {
  clearInterval(levelTimer);
  if (isRecording()) { recorder.onstop = null; recorder.stop(); }
  stream?.getTracks().forEach((t) => t.stop());
  stream = null; analyser = null; recorder = null; chunks = []; levels = [];
}
