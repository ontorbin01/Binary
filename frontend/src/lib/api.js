import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const bn = (num) => {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => map[d]);
};

export const taka = (num) => `৳ ${bn(Number(num).toLocaleString("en-US"))}`;

const api = axios.create({ baseURL: API });

export const apiGet = (path, params) => api.get(path, { params }).then((r) => r.data);
export const apiPost = (path, body) => api.post(path, body).then((r) => r.data);
export const apiPut = (path, body) => api.put(path, body).then((r) => r.data);

export const DISTRICTS = [
  "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ",
  "বগুড়া", "সাতক্ষীরা", "সিরাজগঞ্জ", "কুমিল্লা", "যশোর", "দিনাজপুর", "নোয়াখালী",
];

export function parseVideo(url = "") {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return {
      type: "youtube",
      embed: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0`,
      thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }
  if (/facebook\.com|fb\.watch/.test(url)) {
    return {
      type: "facebook",
      embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true&mute=true&show_text=false`,
    };
  }
  return { type: "file", embed: url };
}

