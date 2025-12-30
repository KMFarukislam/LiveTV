const video = document.getElementById("video");
const list = document.getElementById("channelList");
const catsEl = document.getElementById("categories");
const search = document.getElementById("search");
const now = document.getElementById("nowPlaying");

let hls;
let channels = [];
let currentCat = localStorage.getItem("lastCat") || "All";
let lastUrl = localStorage.getItem("lastChannel");

const CACHE_KEY = "iptv_channels";
const CACHE_TTL = 6 * 60 * 60 * 1000;

/* LOAD CHANNELS FAST */
async function loadChannels() {
  const cache = localStorage.getItem(CACHE_KEY);
  if (cache) {
    const { t, d } = JSON.parse(cache);
    if (Date.now() - t < CACHE_TTL) {
      channels = d;
      init();
      refreshBG();
      return;
    }
  }
  await fetchFresh();
}

async function fetchFresh() {
  const r = await fetch("data/channels.json", { cache:"no-store" });
  channels = (await r.json()).filter(c => c.url);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ t:Date.now(), d:channels }));
  init();
}

function refreshBG() {
  fetch("data/channels.json")
    .then(r=>r.json())
    .then(d=>localStorage.setItem(CACHE_KEY, JSON.stringify({ t:Date.now(), d })));
}

/* UI */
function init() {
  buildCats();
  filter();
  if (lastUrl) {
    const ch = channels.find(c=>c.url===lastUrl);
    if (ch) play(ch);
  }
}

function buildCats() {
  catsEl.innerHTML="";
  ["All", ...new Set(channels.map(c=>c.category).filter(Boolean))]
    .forEach(c=>{
      const li=document.createElement("li");
      li.textContent=c;
      if(c===currentCat) li.classList.add("active");
      li.onclick=()=>{ currentCat=c; localStorage.setItem("lastCat",c); filter(); };
      catsEl.appendChild(li);
    });
}

function render(arr) {
  list.innerHTML="";
  arr.forEach(c=>{
    const li=document.createElement("li");
    li.innerHTML=`<img loading="lazy" src="${c.logo||""}" onerror="this.style.display='none'"><span>${c.name}</span>`;
    li.onclick=()=>play(c,li);
    list.appendChild(li);
  });
}

/* PLAY */
function play(c, el) {
  document.querySelectorAll("#channelList li").forEach(x=>x.classList.remove("active"));
  if(el) el.classList.add("active");

  now.textContent="Now Playing: "+c.name;
  localStorage.setItem("lastChannel", c.url);

  if(hls) hls.destroy();

  if(video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src=c.url;
  } else {
    hls=new Hls({
      lowLatencyMode:true,
      maxBufferLength:10,
      backBufferLength:30
    });
    hls.loadSource(c.url);
    hls.attachMedia(video);
  }
  video.play();
}

/* FILTER */
function filter() {
  let arr = channels;
  if(currentCat!=="All") arr=arr.filter(c=>c.category===currentCat);
  const q=search.value.toLowerCase();
  if(q) arr=arr.filter(c=>c.name.toLowerCase().includes(q));
  render(arr);
}

search.addEventListener("input", filter);
loadChannels();
