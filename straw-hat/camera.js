"use strict";

window.createCameraControl = function createCameraControl({
  button, panel, video, status, guide, recovery, retry, dismiss, onFeedback, onHandShape, onTurn
}) {
  let active = null;
  const visionRoot = "./vision";
  const label = button.lastElementChild;

  function setRecovery(visible) {
    recovery.hidden = !visible;
    panel.classList.toggle("recovering", visible);
  }

  function stopCamera() {
    const session = active;
    if (!session) return;
    active = null;
    clearInterval(session.interval);
    session.stream?.getTracks().forEach(track => track.stop());
    session.detector?.close();
    video.srcObject = null;
    video.hidden = true;
    guide.hidden = true;
    panel.hidden = true;
    button.setAttribute("aria-pressed", "false");
    label.textContent = "手势";
  }

  function distance(a, b) {
    return Math.hypot((a.x - b.x) * video.videoWidth / video.videoHeight, a.y - b.y);
  }

  function handShape(hand) {
    const palm = distance(hand[0], hand[9]);
    if (palm < .025) return "";
    const tips = [8, 12, 16, 20];
    const extended = tips.filter(tip => distance(hand[0], hand[tip]) > distance(hand[0], hand[tip - 2]) * 1.14).length;
    if (distance(hand[4], hand[8]) < palm * .27 && extended >= 1) return "pinch";
    if (extended >= 4) return "open";
    if (extended <= 1) return "closed";
    return "";
  }

  function sample(session) {
    if (video.readyState < 2 || session.lastFrame === video.currentTime) return;
    session.lastFrame = video.currentTime;
    let hand;
    try {
      hand = session.detector.detectForVideo(video, performance.now()).landmarks[0];
    } catch {
      stopCamera();
      onFeedback("手势识别已中断，你仍然可以拖动圣诞树。");
      return;
    }
    if (!hand) {
      session.lastX = null;
      session.lastShape = "";
      session.consistentFrames = 0;
      session.latched = "";
      status.textContent = "把一只手放在画面中央";
      return;
    }
    const x = 1 - hand[9].x;
    if (session.lastX !== null) onTurn(Math.max(-.16, Math.min(.16, (x - session.lastX) * 2.6)));
    session.lastX = x;
    const shape = handShape(hand);
    session.consistentFrames = shape === session.lastShape ? session.consistentFrames + 1 : 1;
    session.lastShape = shape;
    if (session.consistentFrames >= 3 && shape !== session.latched) {
      session.latched = shape;
      if (shape) onHandShape(shape);
    }
    status.textContent = "已识别手部 · 左右移动旋转";
  }

  async function startCamera() {
    if (active) return;
    onFeedback("");
    if (!window.isSecureContext || location.protocol === "file:") {
      onFeedback("请从在线网页或 localhost 打开手势控制。");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      onFeedback("当前浏览器无法开启摄像头，可以继续用触屏或鼠标。");
      return;
    }
    const session = {
      stream: null, detector: null, interval: null, lastFrame: -1, lastX: null,
      lastShape: "", consistentFrames: 0, latched: ""
    };
    active = session;
    setRecovery(false);
    button.setAttribute("aria-pressed", "true");
    label.textContent = "关闭手势";
    panel.hidden = false;
    status.textContent = "等待摄像头权限";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" }
      });
      if (active !== session) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      session.stream = stream;
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      if (active !== session) return;
      status.textContent = "正在加载手势识别";
      const { FilesetResolver, HandLandmarker } = await import(visionRoot + "/vision_bundle.mjs");
      if (active !== session) return;
      const files = await FilesetResolver.forVisionTasks(visionRoot + "/wasm");
      if (active !== session) return;
      const detector = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: "./hand_landmarker.task", delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1
      });
      if (active !== session) {
        detector.close();
        return;
      }
      session.detector = detector;
      guide.hidden = false;
      status.textContent = "把一只手放在画面中央";
      session.interval = setInterval(() => sample(session), 112);
      for (const track of stream.getVideoTracks()) {
        track.addEventListener("ended", () => {
          if (active !== session) return;
          stopCamera();
          onFeedback("摄像头已关闭，可以继续拖动圣诞树。");
        }, { once: true });
      }
    } catch (error) {
      if (active !== session) return;
      stopCamera();
      if (!session.stream && error.name === "NotAllowedError") {
        status.textContent = "摄像头权限未开启";
        panel.hidden = false;
        setRecovery(true);
        return;
      }
      onFeedback("手势控制暂时无法启动，可以继续拖动圣诞树。");
    }
  }

  button.addEventListener("click", () => {
    if (active) stopCamera();
    else startCamera();
  });
  retry.addEventListener("click", startCamera);
  dismiss.addEventListener("click", () => {
    setRecovery(false);
    panel.hidden = true;
    button.focus();
  });
  window.addEventListener("pagehide", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
  });
  return stopCamera;
};
