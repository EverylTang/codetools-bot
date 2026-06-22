// 工具处理模块 - 处理用户发送的文本数据

const QRCode = require('qrcode');

// JSON格式化
function formatJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return `❌ JSON格式错误: ${e.message}`;
  }
}

// JSON压缩
function minifyJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed);
  } catch (e) {
    return `❌ JSON格式错误: ${e.message}`;
  }
}

// 计算Hash
function calculateHash(text) {
  const crypto = require('crypto');
  return {
    md5: crypto.createHash('md5').update(text).digest('hex'),
    sha1: crypto.createHash('sha1').update(text).digest('hex'),
    sha256: crypto.createHash('sha256').update(text).digest('hex')
  };
}

// Base64编码
function base64Encode(text) {
  return Buffer.from(text, 'utf-8').toString('base64');
}

// Base64解码
function base64Decode(text) {
  try {
    return Buffer.from(text, 'base64').toString('utf-8');
  } catch (e) {
    return `❌ Base64格式错误: ${e.message}`;
  }
}

// 检测是否是Base64
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

// 生成二维码 PNG Buffer
async function generateQRCodeBuffer(text) {
  return QRCode.toBuffer(text, {
    type: 'png',
    margin: 2,
    width: 512,
    errorCorrectionLevel: 'M'
  });
}

module.exports = {
  formatJson,
  minifyJson,
  calculateHash,
  base64Encode,
  base64Decode,
  isBase64,
  generateQRCodeBuffer
};
