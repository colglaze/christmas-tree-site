"use strict";

const crew = [
  { name: "路飞", role: "船长", color: "#1c243b", blessing: "甲板上的烤肉有你一份！吃饱了，明年再一起去看没见过的海。" },
  { name: "索隆", role: "剑士", color: "#112f3b", blessing: "下雪的时候，小心甲板滑。往亮着灯的地方走，我在那儿等你。" },
  { name: "娜美", role: "航海士", color: "#202e40", blessing: "送你一颗橘子。剥开的时候，记得给自己留最甜的那一瓣。" },
  { name: "乌索普", role: "狙击手", color: "#142a3b", blessing: "要听我在暴雪里救下八千人的故事吗？来，坐近一点。今晚的故事有新结局。" },
  { name: "山治", role: "厨师", color: "#162b4a", blessing: "热可可已经煮好了。坐到灯下，先暖暖手，剩下的交给厨房。" },
  { name: "乔巴", role: "船医", color: "#26253f", blessing: "围巾系好啦。今天的医嘱是早点休息，然后放心做一个甜甜的梦！" },
  { name: "罗宾", role: "考古学家", color: "#222442", blessing: "雪花落在书页上，就像一封迟到的信。很高兴，你来赴今晚的约。" },
  { name: "弗兰奇", role: "船匠", color: "#142e43", blessing: "给树灯换了新电池。等你站上甲板，我们一起把整片海照亮！" },
  { name: "布鲁克", role: "音乐家", color: "#182840", blessing: "这首曲子送给你。就算雪落个不停，船上的舞步也不会停。" },
  { name: "甚平", role: "舵手", color: "#132d47", blessing: "正好海风轻了。今晚我来掌舵，你安心看雪，等天亮了再继续出发。" }
];

const byId = id => document.getElementById(id);
const dialog = byId("crew-dialog");
const crewList = byId("crew-list");
const ornamentLayer = byId("ornaments");
const scatterButton = byId("scatter");
const frostButton = byId("frost");
const spiralButton = byId("spiral");
const crewToggle = byId("crew-toggle");
const crewGallery = byId("crew-gallery");
const presentButton = byId("present");
const soundButton = byId("sound");
const feedback = byId("feedback");
let activeOrnament = 0;
let scattered = false;

function setCharm(element, index) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  element.style.setProperty("--face", crew[index].color);
  element.style.setProperty("--sheet-x", column * 25 + "%");
  element.style.setProperty("--sheet-y", row * 100 + "%");
}

function makeCharm(index) {
  const charm = document.createElement("span");
  charm.className = "portrait";
  charm.setAttribute("aria-hidden", "true");
  setCharm(charm, index);
  return charm;
}

function showBlessing(index) {
  const member = crew[index];
  activeOrnament = index;
  byId("crew-name").textContent = member.name;
  byId("crew-role").textContent = member.role;
  byId("crew-message").textContent = member.blessing;
  setCharm(byId("crew-portrait"), index);
  if (!dialog.open) dialog.showModal();
}

const markers = crew.map((member, index) => {
  const listButton = document.createElement("button");
  listButton.type = "button";
  listButton.className = "crew-button";
  const name = document.createElement("span");
  name.textContent = member.name;
  listButton.append(makeCharm(index), name);
  listButton.addEventListener("click", () => showBlessing(index));
  crewList.append(listButton);

  const ornament = document.createElement("button");
  ornament.type = "button";
  ornament.className = "bauble";
  ornament.tabIndex = -1;
  ornament.title = member.name + "的挂饰";
  ornament.setAttribute("aria-label", ornament.title);
  const art = makeCharm(index);
  art.classList.add("orbit-portrait");
  const caption = document.createElement("span");
  caption.className = "bauble-name";
  caption.textContent = member.name;
  caption.setAttribute("aria-hidden", "true");
  ornament.append(art, caption);
  ornament.hidden = true;
  ornament.addEventListener("click", () => showBlessing(index));
  ornamentLayer.append(ornament);
  return ornament;
});

const treeScene = createTreeScene(byId("tree"), markers, {
  stage: byId("stage"), sky: byId("night"), particles: byId("ice-cloud"), poster: byId("tree-poster")
});

function setScatter(value) {
  if (scattered === value) return;
  scattered = value;
  if (value) setGallery(false);
  scatterButton.setAttribute("aria-pressed", String(value));
  scatterButton.lastElementChild.textContent = value ? "聚回" : "散开";
  byId("stage-help").textContent = value ? "点击冰晶挂饰，看船员的祝福" : "拖动旋转 · 点击树上的亮点";
  treeScene.scatter(value);
}

function showFeedback(message) {
  feedback.textContent = message;
  feedback.hidden = !message;
}

function setShape(spiral) {
  frostButton.setAttribute("aria-pressed", String(!spiral));
  spiralButton.setAttribute("aria-pressed", String(spiral));
  setScatter(false);
  treeScene.spiral(spiral);
}

function setGallery(open) {
  crewGallery.hidden = !open;
  crewToggle.setAttribute("aria-expanded", String(open));
}

scatterButton.addEventListener("click", () => setScatter(!scattered));
frostButton.addEventListener("click", () => setShape(false));
spiralButton.addEventListener("click", () => setShape(true));
crewToggle.addEventListener("click", () => setGallery(crewGallery.hidden));
byId("close-collection").addEventListener("click", () => {
  setGallery(false);
  crewToggle.focus();
});
byId("close-card").addEventListener("click", () => dialog.close());
byId("next-card").addEventListener("click", () => showBlessing((activeOrnament + 1) % crew.length));
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

function setPresenting(value) {
  document.body.classList.toggle("is-presenting", value);
  const label = value ? "退出全屏展示" : "全屏展示";
  presentButton.title = label;
  presentButton.setAttribute("aria-label", label);
  presentButton.setAttribute("aria-pressed", String(value));
}

function closePresentation() {
  setPresenting(false);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

presentButton.addEventListener("click", () => {
  if (document.body.classList.contains("is-presenting")) {
    closePresentation();
    return;
  }
  if (stopCamera) stopCamera();
  setGallery(false);
  setPresenting(true);
  document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) setPresenting(false);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !dialog.open && !document.fullscreenElement) {
    setGallery(false);
    setPresenting(false);
  }
});

const melody = [
  [67,1], [72,1], [72,.5], [74,.5], [72,.5], [71,.5], [69,1], [69,1],
  [69,1], [74,1], [74,.5], [76,.5], [74,.5], [72,.5], [71,1], [67,1],
  [67,1], [76,1], [76,.5], [77,.5], [76,.5], [74,.5], [72,1], [69,1],
  [67,.5], [67,.5], [69,1], [74,1], [71,1], [72,3], [0,2]
];
const beat = .43;
let audio = null;
let audioGain = null;
let sequenceTimer = null;
let songPlaying = false;
let noteIndex = 0;
let nextNoteTime = 0;

function ringNote(note, time, length) {
  const pitch = 440 * 2 ** ((note - 69) / 12);
  for (const [ratio, volume, decay] of [[1,.095,1.3], [2,.026,.69], [3,.009,.44]]) {
    const partial = audio.createOscillator();
    const gain = audio.createGain();
    partial.type = "sine";
    partial.frequency.value = pitch * ratio;
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, time + length + decay);
    partial.connect(gain).connect(audioGain);
    partial.start(time);
    partial.stop(time + length + decay + .05);
  }
}

function scheduleMusic() {
  if (nextNoteTime < audio.currentTime) nextNoteTime = audio.currentTime + .06;
  while (nextNoteTime < audio.currentTime + .28) {
    const [note, beats] = melody[noteIndex];
    if (note) ringNote(note, nextNoteTime, beats * beat);
    nextNoteTime += beats * beat;
    noteIndex = (noteIndex + 1) % melody.length;
  }
}

function stopMusic() {
  clearInterval(sequenceTimer);
  sequenceTimer = null;
  if (audioGain && audio) audioGain.gain.setTargetAtTime(0, audio.currentTime, .045);
  songPlaying = false;
  soundButton.title = "开启音乐";
  soundButton.setAttribute("aria-label", "开启音乐");
  soundButton.setAttribute("aria-pressed", "false");
}

soundButton.addEventListener("click", async () => {
  if (songPlaying) {
    stopMusic();
    return;
  }
  soundButton.disabled = true;
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    await audio.resume();
    audioGain = audio.createGain();
    audioGain.gain.value = .45;
    audioGain.connect(audio.destination);
    nextNoteTime = audio.currentTime + .04;
    noteIndex = 0;
    scheduleMusic();
    sequenceTimer = setInterval(scheduleMusic, 75);
    songPlaying = true;
    soundButton.title = "静音";
    soundButton.setAttribute("aria-label", "静音");
    soundButton.setAttribute("aria-pressed", "true");
  } catch {
    showFeedback("当前浏览器无法播放音乐。");
  } finally {
    soundButton.disabled = false;
  }
});
window.addEventListener("pagehide", stopMusic);

const stopCamera = createCameraControl({
  button: byId("camera"),
  panel: byId("camera-panel"),
  video: byId("camera-preview"),
  status: byId("camera-status"),
  guide: byId("gesture-help"),
  recovery: byId("camera-recovery"),
  retry: byId("camera-retry"),
  dismiss: byId("camera-dismiss"),
  onFeedback: showFeedback,
  onHandShape(shape) {
    if (dialog.open) return;
    if (shape === "pinch") showBlessing(treeScene.frontOrnament());
    else setScatter(shape === "open");
  },
  onTurn(delta) {
    if (!dialog.open) treeScene.turn(delta);
  }
});
