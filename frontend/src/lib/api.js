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
