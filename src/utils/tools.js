// 工具处理模块 - 处理用户发送的文本数据

const crypto = require('crypto');
const QRCode = require('qrcode');

function formatJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return `❌ JSON格式错误: ${e.message}`;
  }
}

function minifyJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed);
  } catch (e) {
    return `❌ JSON格式错误: ${e.message}`;
  }
}

function calculateHash(text) {
  return {
    md5: crypto.createHash('md5').update(text).digest('hex'),
    sha1: crypto.createHash('sha1').update(text).digest('hex'),
    sha256: crypto.createHash('sha256').update(text).digest('hex')
  };
}

function base64Encode(text) {
  return Buffer.from(text, 'utf-8').toString('base64');
}

function base64Decode(text) {
  try {
    return Buffer.from(text, 'base64').toString('utf-8');
  } catch (e) {
    return `❌ Base64格式错误: ${e.message}`;
  }
}

function isBase64(str) {
  if (!str || typeof str !== 'string') return false;
  const normalized = str.trim();
  if (normalized.length === 0 || normalized.length % 4 !== 0) return false;

  try {
    return Buffer.from(normalized, 'base64').toString('base64') === normalized;
  } catch (e) {
    return false;
  }
}

async function generateQRCodeBuffer(text) {
  return QRCode.toBuffer(text, {
    type: 'png',
    margin: 2,
    width: 512,
    errorCorrectionLevel: 'M'
  });
}

function formatDateTime(date, timeZone = 'Asia/Shanghai') {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date).replace(/\//g, '-');
}

function getCurrentTimeInfo() {
  const now = new Date();
  return {
    unixSeconds: Math.floor(now.getTime() / 1000),
    unixMilliseconds: now.getTime(),
    local: formatDateTime(now),
    utc: now.toISOString()
  };
}

function convertTimeInput(input) {
  const value = String(input || '').trim();
  if (!value) throw new Error('请输入时间戳或日期字符串');

  let date;
  if (/^\d{10}$/.test(value)) {
    date = new Date(Number(value) * 1000);
  } else if (/^\d{13}$/.test(value)) {
    date = new Date(Number(value));
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error('无法识别时间格式，请输入 10 位秒级时间戳、13 位毫秒时间戳或日期字符串');
  }

  return {
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMilliseconds: date.getTime(),
    local: formatDateTime(date),
    utc: date.toISOString()
  };
}

function urlTool(input) {
  const text = String(input || '').trim();
  if (!text) throw new Error('请输入 URL 或需要编解码的文本');

  let decoded = '';
  try { decoded = decodeURIComponent(text); } catch (_) { decoded = '解码失败：输入包含非法百分号编码'; }

  return {
    encoded: encodeURIComponent(text),
    decoded
  };
}

function generateUUID(countInput = '1') {
  const count = Math.max(1, Math.min(20, Number.parseInt(countInput, 10) || 1));
  return Array.from({ length: count }, () => crypto.randomUUID());
}

function base64UrlDecode(part) {
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function decodeJwt(token) {
  const parts = String(token || '').trim().split('.');
  if (parts.length < 2) throw new Error('请输入有效 JWT，至少包含 header.payload 两段');

  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])),
      signaturePresent: Boolean(parts[2])
    };
  } catch (e) {
    throw new Error('JWT 解码失败：' + e.message);
  }
}

function hexToRgb(hex) {
  let value = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    value = value.split('').map(ch => ch + ch).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error('请输入 HEX 颜色，例如 #ff8800');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    hex: '#' + value.toLowerCase()
  };
}

function rgbToHex(r, g, b) {
  const nums = [r, g, b].map(n => Number.parseInt(n, 10));
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 255)) throw new Error('RGB 值必须在 0-255 之间');
  return '#' + nums.map(n => n.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function colorTool(input) {
  const text = String(input || '').trim();
  if (!text) throw new Error('请输入 HEX 或 RGB 颜色，例如 #ff8800 或 255,136,0');

  let rgb;
  const rgbMatch = text.match(/^(?:rgb\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map(Number);
    rgb = { r, g, b, hex: rgbToHex(r, g, b) };
  } else {
    rgb = hexToRgb(text);
  }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { hex: rgb.hex, rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` };
}

const htmlEntities = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
};

function htmlEscape(text) {
  return String(text || '').replace(/[&<>"']/g, ch => htmlEntities[ch]);
}

function htmlUnescape(text) {
  return String(text || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function htmlTool(input) {
  const text = String(input || '');
  if (!text.trim()) throw new Error('请输入 HTML 文本');
  return { escaped: htmlEscape(text), unescaped: htmlUnescape(text) };
}

function splitWords(input) {
  return String(input || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.toLowerCase());
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function caseTool(input) {
  const words = splitWords(input);
  if (!words.length) throw new Error('请输入需要转换命名格式的文本');
  return {
    camelCase: words[0] + words.slice(1).map(capitalize).join(''),
    PascalCase: words.map(capitalize).join(''),
    snake_case: words.join('_'),
    kebab_case: words.join('-'),
    CONSTANT_CASE: words.join('_').toUpperCase()
  };
}

function generatePassword(input = '') {
  const match = String(input).match(/\d+/);
  const length = Math.max(8, Math.min(64, match ? Number(match[0]) : 16));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(0, chars.length)];
  }
  return result;
}

function explainCron(input) {
  const parts = String(input || '').trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('请输入 5 段 cron 表达式，例如 */5 * * * *');
  const labels = ['分钟', '小时', '日期', '月份', '星期'];
  const describe = (part, label) => {
    if (part === '*') return `${label}：每${label}`;
    if (part.startsWith('*/')) return `${label}：每 ${part.slice(2)} 个单位`;
    if (part.includes(',')) return `${label}：在 ${part} 这些值`;
    if (part.includes('-')) return `${label}：从 ${part.replace('-', ' 到 ')}`;
    return `${label}：${part}`;
  };
  return parts.map((part, i) => describe(part, labels[i]));
}

function parseUserAgent(input) {
  const ua = String(input || '').trim();
  if (!ua) throw new Error('请输入 User-Agent 字符串');
  const browser = ua.includes('Edg/') ? 'Edge' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Firefox/') ? 'Firefox' : ua.includes('Safari/') ? 'Safari' : 'Unknown';
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac OS X') ? 'macOS' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : ua.includes('Linux') ? 'Linux' : 'Unknown';
  const device = /Mobile|iPhone|Android/.test(ua) ? 'Mobile' : /iPad|Tablet/.test(ua) ? 'Tablet' : 'Desktop';
  return { browser, os, device };
}

function jsonPathTool(input) {
  const lines = String(input || '').trim().split('\n');
  if (lines.length < 2) throw new Error('请第一行输入路径，如 user.name，后面输入 JSON');
  const path = lines[0].trim().replace(/^\$\.?/, '');
  const jsonText = lines.slice(1).join('\n');
  const data = JSON.parse(jsonText);
  const value = path ? path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) return acc[arrayMatch[1]]?.[Number(arrayMatch[2])];
    return acc[key];
  }, data) : data;
  return value;
}

function escapeMarkdownV2(input) {
  const text = String(input || '');
  if (!text.trim()) throw new Error('请输入需要转义的 Markdown 文本');
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

function regexTool(input) {
  const lines = String(input || '').split('\n');
  if (lines.length < 2) throw new Error('请第一行输入正则，后面输入待匹配文本');
  const patternLine = lines[0].trim();
  const text = lines.slice(1).join('\n');
  const match = patternLine.match(/^\/(.*)\/([gimsuy]*)$/);
  const pattern = match ? match[1] : patternLine;
  const flags = match ? match[2] : 'g';
  const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  return Array.from(text.matchAll(regex)).slice(0, 20).map(m => ({ match: m[0], index: m.index }));
}

module.exports = {
  formatJson,
  minifyJson,
  calculateHash,
  base64Encode,
  base64Decode,
  isBase64,
  generateQRCodeBuffer,
  getCurrentTimeInfo,
  convertTimeInput,
  urlTool,
  generateUUID,
  decodeJwt,
  colorTool,
  htmlTool,
  caseTool,
  generatePassword,
  explainCron,
  parseUserAgent,
  jsonPathTool,
  escapeMarkdownV2,
  regexTool
};
