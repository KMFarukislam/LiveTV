const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const categoriesEl = document.getElementById("categories");
const search = document.getElementById("search");
const nowPlaying = document.getElementById("nowPlaying");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

let hls;
let channels = [];
let currentCategory = "All";
let lastChannelUrl = localStorage.getItem("lastChannel");

// Toggle sidebar
toggleBtn.onclick = () => {
  sidebar.classList.toggle("open");
  sidebar.classList.toggle("collapsed");
};

// Load channels
fetch("data/channels.json")
  .then(r => r.json())
  .then(data => {
    channels = data.filter(c => c.url);
    buildCategories();
    renderChannels(channels);

    if (lastChannelUrl) {
      const ch = channels.find(c => c.url === lastChannelUrl);
      if (ch) playChannel(ch);
    }
  });

// Categories
function buildCategories() {
  const cats = ["All", ...new Set(channels.map(c => c.category).filter(Boolean))];
  categoriesEl.innerHTML = "";

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

// Render
function renderChannels(list) {
  channelList.innerHTML = "";

  list.forEach(ch => {
    const li = document.createElement("li");
    li.tabIndex = 0;

    li.innerHTML = `
      <img src="${ch.logo || ''}" onerror="this.style.display='none'">
      <span>${ch.name}</span>
    `;

    li.onclick = () => playChannel(ch, li);
    li.onkeydown = e => e.key === "Enter" && playChannel(ch, li);

    channelList.appendChild(li);
  });
}

// Play
function playChannel(channel, el) {
  document.querySelectorAll(".channels li").forEach(li => li.classList.remove("active"));
  if (el) el.classList.add("active");

  nowPlaying.textContent = "Now Playing: " + channel.name;
  localStorage.setItem("lastChannel", channel.url);

  if (hls) hls.destroy();

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
  } else {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  }

  video.play();
  sidebar.classList.remove("open");
}

// Filter
function filterChannels() {
  let list = channels;

  if (currentCategory !== "All") {
    list = list.filter(c => c.category === currentCategory);
  }

  const q = search.value.toLowerCase();
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q));

  renderChannels(list);
}

search.addEventListener("input", filterChannels);
