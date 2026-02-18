const STATUS = document.getElementById('status');
const VIDEO = document.getElementById('webcam');
//const RESULT = document.getElementById('result');
const ENABLE_CAM_BUTTON = document.getElementById('enableCam');
const OVERLAY = document.getElementById('canvas');
let model, canvas, ctx;
let videoPlaying = false;


(async () => {
  await tf.ready();
  console.log("✅ TF.js initialized");

  const backends = tf.engine().registryFactory;
  console.log("Available TFJS backends:", Object.keys(backends));

  try {
	await tf.setBackend('webgl');
	await tf.ready();
	console.log("✅ WebGL backend successfully set");
  } catch (err) {
	console.error("❌ Failed to set WebGL backend:", err);
  }

  console.log("👉 Active backend:", tf.getBackend());

  // Check if WebGL context can be created manually
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl) {
	console.log("🎨 WebGL context created successfully");
  } else {
	console.error("🚫 WebGL context creation failed. Your GPU or driver might be blocked.");
  }
})();


ENABLE_CAM_BUTTON.addEventListener('click', enableCam);


function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam() {
  if (!hasGetUserMedia()) {
    console.warn('getUserMedia() is not supported by your browser');
    return;
  }

  const constraints = {
    video: {
      facingMode: { ideal: 'environment' }, // back camera
      width: { ideal: 1920 },
      height: { ideal: 1280 }
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      VIDEO.srcObject = stream;
      VIDEO.addEventListener('loadeddata', () => {
        videoPlaying = true;
        ENABLE_CAM_BUTTON.classList.add('removed');
      });
    })
    .catch(err => console.error('Camera access error:', err));
}




// main detection loop
async function detectFrame() {
	//console.log("🎨 Sunt in bucla !");
  const predictions = await model.detect(VIDEO);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
	console.log("✅ predictii gasite",predictions);
  const resText = predictions
    .slice(0, 10)
    .map(p => `${p.class}: ${(p.score * 100).toFixed(1)}%`)
    .join("<br>");
  STATUS.innerHTML = resText;

  for (const p of predictions) {
    const [x, y, w, h] = p.bbox;
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'white';
    ctx.font = '12px arial';
    ctx.fillText(`${p.class} ${(p.score * 100).toFixed(1)}%`, x, y > 10 ? y - 5 : 10);
  }

  setTimeout(detectFrame, 500); // 1 prediction per second
}


(async () => {
  await tf.setBackend('webgl');
  await tf.ready();
  STATUS.innerText = 'TF loaded successfully!';
  
  model = await cocoSsd.load();
  STATUS.innerText = 'Model loaded successfully!\nCatalin Ungurean 2025';

  // Wait until video is ready
  if (VIDEO.readyState < 2) {
    await new Promise(resolve => {
      VIDEO.onloadeddata = resolve;
    });
  }


  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = VIDEO.videoWidth;
  canvas.height = VIDEO.videoHeight;

  
  detectFrame();
})();

