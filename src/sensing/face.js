import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// The WASM version always matches the installed package (injected by vite.config.js).
const MP_VERSION = __MP_VERSION__;
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarkerPromise = null;   // the model is loaded once and reused after ⏸️ / resume

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM);
      const opts = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      try { return await FaceLandmarker.createFromOptions(vision, opts('GPU')); }
      catch { return FaceLandmarker.createFromOptions(vision, opts('CPU')); }   // some phones lack WebGL2
    })();
    landmarkerPromise.catch(() => { landmarkerPromise = null; });
  }
  return landmarkerPromise;
}

/**
 * Starts the front camera and calls onSample ~3×/s with blendshape scores.
 * Frames are analysed in memory and thrown away — never stored or sent.
 * Returns a stop function (used by ⏸️ and when the app goes to the background).
 */
export async function startFace(videoEl, onSample) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: 320, height: 240 }, audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();

  let stopped = false, last = 0, raf = 0;
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  };

  let landmarker;
  try { landmarker = await getLandmarker(); }
  catch (e) { stop(); throw e; }

  const loop = () => {
    if (stopped) return;
    const now = performance.now();
    if (now - last > 333 && videoEl.readyState >= 2) {       // ~3 times per second
      last = now;
      const res = landmarker.detectForVideo(videoEl, now);
      const cats = res.faceBlendshapes?.[0]?.categories;
      if (!cats) {
        onSample({ present: false, t: now });
      } else {
        const b = Object.fromEntries(cats.map((c) => [c.categoryName, c.score]));
        onSample({
          present: true, t: now,
          smile: (b.mouthSmileLeft + b.mouthSmileRight) / 2,
          frown: (b.mouthFrownLeft + b.mouthFrownRight) / 2,
          browSad: b.browInnerUp,
          eyeOpen: 1 - (b.eyeBlinkLeft + b.eyeBlinkRight) / 2,
        });
      }
    }
    raf = requestAnimationFrame(loop);
  };
  loop();
  return stop;
}
