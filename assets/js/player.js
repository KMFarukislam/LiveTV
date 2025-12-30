const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const categoriesEl = document.getElementById("categories");
const searchInput = document.getElementById("search");
const nowPlaying = document.getElementById("nowPlaying");

let hls;
let channels = [];
let currentCategory = "All";

const CACHE_KEY = "iptv_channels_v1";
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 hours

/* =========================
   FAST CHANNEL LOADING
========================= */

async function loadChannels() {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    const { time, data } = JSON.parse(cached);
    if (Date.now() - time < CACHE_TIME) {
      channels = data;
      initUI();
      refreshChannelsInBackground();
      return;
    }
  }

  await fetchChannels();
}

async function fetchChannels() {
  const res = await fetch("data/channels.json", { cache: "no-store" });
  const data = await res.json();
  channels = data.filter(c => c.url);

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ time: Date.now(), data: channels })
  );

  initUI();
}

// Background refresh (no UI block)
function refreshChannelsInBackground() {
  fetch("data/channels.json")
    .then(r => r.json())
    .then(data => {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), data })
      );
    });
}

/* =========================
   UI
========================= */

function initUI() {
  buildCategories();
  renderChannels(channels);
}

function buildCategories() {
  categoriesEl.innerHTML = "";

  const cats = ["All", ...new Set(channels.map(c => c.category).filter(Boolean))];

  cats.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;
    if (cat === "All") li.classList.add("active");

    li.onclick = () => {
      document.querySelectorAll("#categories li").forEach(x => x.classList.remove("active"));
      li.classList.add("active");
      currentCategory = cat;
      filterChannels();
    };

    categoriesEl.appendChild(li);
  });
}

function renderChannels(list) {
  channelList.innerHTML = "";

  list.forEach(ch => {
    const li = document.createElement("li");

    li.innerHTML = `
      <img src="${ch.logo || ''}" loading="lazy"
           onerror="this.style.display='none'">
      <span>${ch.name}</span>
    `;

    li.onclick = () => playChannel(ch, li);
    channelList.appendChild(li);
  });
}

/* =========================
   FAST PLAYBACK (HLS)
========================= */

function playChannel(channel, el) {
  document.querySelectorAll("#channelList li").forEach(li => li.classList.remove("active"));
  if (el) el.classList.add("active");

  nowPlaying.textContent = "Now Playing: " + channel.name;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  // Native HLS (Safari / iOS)
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
    video.play();
    return;
  }

  // Tuned HLS.js
  hls = new Hls({
    lowLatencyMode: true,
    backBufferLength: 30,
    maxBufferLength: 10,
    maxMaxBufferLength: 30,
    liveSyncDuration: 2,
    liveMaxLatencyDuration: 6,
    enableWorker: true,
    startLevel: -1
  });

  hls.loadSource(channel.url);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
}

/* =========================
   FILTER
========================= */

function filterChannels() {
  let list = channels;

  if (currentCategory !== "All") {
    list = list.filter(c => c.category === currentCategory);
  }

  const q = searchInput.value.toLowerCase();
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q));

  renderChannels(list);
}

searchInput.addEventListener("input", filterChannels);

/* INIT */
loadChannels();
