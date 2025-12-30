const playlistUrl = "https://iptv-org.github.io/iptv/index.m3u";
const logosUrl = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");

let channels = [];
let logos = {};
let hls;

Promise.all([
  fetch(playlistUrl).then(r => r.text()),
  fetch(logosUrl).then(r => r.json())
]).then(([playlist, logoData]) => {
  logoData.forEach(c => logos[c.name] = c.logo);
  parsePlaylist(playlist);
  render();
});

function parsePlaylist(data){
  const lines = data.split("\n");
  let ch = {};

  lines.forEach(l=>{
    if(l.startsWith("#EXTINF")){
      ch = {};
      ch.name = l.split(",")[1];
    }
    else if(l.startsWith("http")){
      ch.url = l.trim();
      ch.logo = logos[ch.name] || "https://via.placeholder.com/80?text=TV";
      channels.push(ch);
    }
  });
}

function render(){
  grid.innerHTML="";
  channels
    .filter(c=>!search.value || c.name.toLowerCase().includes(search.value.toLowerCase()))
    .forEach(c=>{
      const card = document.createElement("div");
      card.className="channel-card";
      card.innerHTML=`
        <img src="${c.logo}">
        <div class="channel-name">${c.name}</div>
      `;
      card.onclick=()=>play(c);
      grid.appendChild(card);
    });
}

function play(c){
  nowPlaying.textContent="Now Playing: "+c.name;
  if(hls) hls.destroy();

  if(Hls.isSupported()){
    hls=new Hls();
    hls.loadSource(c.url);
    hls.attachMedia(video);
  } else {
    video.src=c.url;
  }
}

search.oninput=render;
