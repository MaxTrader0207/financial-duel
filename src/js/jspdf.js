// jspdf.js — jsPDF (≈360 KB) is only needed when a PDF is exported, so it is loaded on the first export instead of
// with the page. The URL comes from .env*: the local vendor copy, or cdnjs for the claude.ai single file.
let pending = null;
export function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (!pending) pending = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = import.meta.env.VITE_JSPDF_URL; s.async = true;
    s.onload = () => (window.jspdf && window.jspdf.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('PDF 元件載入失敗')));
    s.onerror = () => { pending = null; s.remove(); reject(new Error('PDF 元件載入失敗，請確認網路連線後再試')); };
    document.head.appendChild(s);
  });
  return pending;
}
