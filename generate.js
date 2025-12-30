import fs from "fs";
import fetch from "node-fetch";

async function parseM3U(url) {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split("\n");

  const channels = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith("#EXTINF")) {
      const attrs = {};
      const titleMatch = line.match(/,(.*)$/);

      // parse attributes
      line.replace(/([a-zA-Z0-9-]+)="([^"]+)"/g, (_, key, value) => {
        attrs[key] = value;
      });

      current = {
        name: titleMatch ? titleMatch[1] : "",
        group: attrs["group-title"] || "",
        logo: attrs["tvg-logo"] || "",
        tvg_id: attrs["tvg-id"] || "",
      };
    } 
    else if (line && !line.startsWith("#")) {
      current.url = line;
      channels.push(current);
      current = {};
    }
  }

  return channels;
}

async function main() {
  const url = "https://iptv-org.github.io/iptv/index.m3u";
  const channels = await parseM3U(url);

  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync("data/channels.json", JSON.stringify(channels, null, 2));

  console.log(`Saved ${channels.length} channels!`);
}

main();
