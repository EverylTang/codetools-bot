// 工具处理模块 - 处理用户发送的文本数据

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
function calculateHash(text, algorithm = 'sha256') {
  const crypto = require('crypto');
  const hash = crypto.createHash(algorithm).update(text).digest('hex');
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
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (e) {
    return false;
  }
}

module.exports = {
  formatJson,
  minifyJson,
  calculateHash,
  base64Encode,
  base64Decode,
  isBase64
};
