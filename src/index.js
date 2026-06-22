// Vercel Serverless 入口
const { Telegraf } = require('telegraf');
const tools = require('./utils/tools');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const userSessions = new Map();
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const QR_TEXT_LIMIT = 2000;
const MODE_PROMPTS = {
  format_json: '📄 JSON 缩进格式化\n\n请发送 JSON 数据，我会将其格式化为缩进形式。',
  minify_json: '压缩 JSON\n\n请发送 JSON 数据，我会将其压缩为一行。',
  hash: '🔒 Hash 计算\n\n请发送文本，我会计算其 MD5/SHA1/SHA256 哈希值。',
  base64: '🔗 Base64 编解码\n\n请发送文本，我会自动判断并进行 Base64 编码或解码。',
  qr: '🖼️ QR 生成\n\n请发送文本或 URL，我会生成对应的二维码图片。',
  time: '⏱️ 时间工具\n\n请发送 10 位秒级时间戳、13 位毫秒时间戳或日期字符串，我会帮你转换。',
  url: '🌐 URL 编解码\n\n请发送 URL 或文本，我会返回 encode/decode 结果。',
  jwt: '🎫 JWT 解码\n\n请发送 JWT，我会解析 header 和 payload（不验证签名）。',
  color: '🎨 颜色转换\n\n请发送 HEX 或 RGB，例如 #ff8800 或 255,136,0。',
  html: '🏷️ HTML 转义\n\n请发送 HTML 文本，我会返回 escape/unescape 结果。',
  case: '🔤 命名转换\n\n请发送变量名或短语，我会转换 camel/snake/kebab/Pascal。',
  cron: '🕒 Cron 解释\n\n请发送 5 段 cron 表达式，例如 */5 * * * *。',
  ua: '🧭 UA 解析\n\n请发送 User-Agent 字符串。',
  jsonpath: '🔎 JSONPath 简易查询\n\n第一行输入路径，如 user.name 或 items[0].id，后面输入 JSON。',
  md: '📝 MarkdownV2 转义\n\n请发送需要转义的 Markdown 文本。',
  regex: '🔍 Regex 测试\n\n第一行输入正则，如 /foo\\d+/i，后面输入待匹配文本。'
};

function setSession(chatId, mode) {
  userSessions.set(chatId, { mode, timestamp: Date.now() });
}

function getValidSession(chatId) {
  const session = userSessions.get(chatId);
  if (!session) return null;
  if (Date.now() - session.timestamp > SESSION_TIMEOUT_MS) {
    userSessions.delete(chatId);
    return null;
  }
  return session;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [chatId, session] of userSessions.entries()) {
    if (now - session.timestamp > SESSION_TIMEOUT_MS) userSessions.delete(chatId);
  }
}

function sendResponse(ctx, message, keyboard = null) {
  if (keyboard) return ctx.reply(message, { resize_keyboard: true, keyboard });
  return ctx.reply(message);
}

function enterMode(ctx, mode, extra = '') {
  setSession(ctx.message.chat.id, mode);
  return sendResponse(ctx, MODE_PROMPTS[mode] + extra);
}

function formatTimeInfoMessage(title, info) {
  return `${title}\n\n北京时间：${info.local}\nUTC：${info.utc}\nUnix 秒：${info.unixSeconds}\nUnix 毫秒：${info.unixMilliseconds}`;
}

function showTools(ctx) {
  return sendResponse(ctx,
    '📋 工具列表\n\n基础工具：\n/indent JSON 格式化\n/minify JSON 压缩\n/hash Hash 计算\n/base64 Base64 编解码\n/qr 二维码生成\n/time 时间戳转换\n/url URL 编解码\n/uuid UUID 生成\n/jwt JWT 解码\n\n文本/前端工具：\n/color 颜色转换\n/html HTML 转义\n/case 命名转换\n/md MarkdownV2 转义\n/regex 正则测试\n\n辅助工具：\n/password 随机密码\n/cron Cron 解释\n/ua User-Agent 解析\n/jsonpath JSON 路径查询\n\nPremium 功能（订阅后解锁）：\n/batch 批量处理\n/api 高速率 API 访问\n/export 导出 CSV/Excel'
  );
}

function showAbout(ctx) {
  return sendResponse(ctx,
    'ℹ️ CodeTools Bot v1.2\n\n一个面向开发者的 Telegram 工具集合 Bot。\n\n支持 JSON、Hash、Base64、QR、时间戳、URL、UUID、JWT、颜色、HTML、命名、密码、Cron、UA、JSONPath、Markdown、Regex 等工具。'
  );
}

function showTime(ctx) {
  setSession(ctx.message.chat.id, 'time');
  const info = tools.getCurrentTimeInfo();
  return ctx.reply(formatTimeInfoMessage('⏱️ 时间工具', info) + '\n\n请继续发送时间戳或日期字符串进行转换。');
}

bot.command('start', (ctx) => {
  sendResponse(ctx,
    '👋 欢迎使用 CodeTools Bot！\n\n我是一个开发者工具集合，回复 /tools 查看所有工具。',
    [
      ['📄 JSON 工具', '🔒 Hash 工具'],
      ['🔗 Base64', '🖼️ QR 生成'],
      ['⏱️ 时间工具', '🧰 更多工具'],
      ['ℹ️ 关于']
    ]
  );
});

bot.command('tools', showTools);
bot.command('about', showAbout);
bot.command('indent', (ctx) => enterMode(ctx, 'format_json'));
bot.command('minify', (ctx) => enterMode(ctx, 'minify_json'));
bot.command('hash', (ctx) => enterMode(ctx, 'hash'));
bot.command('base64', (ctx) => enterMode(ctx, 'base64'));
bot.command('qr', (ctx) => enterMode(ctx, 'qr'));
bot.command('time', showTime);
bot.command('url', (ctx) => enterMode(ctx, 'url'));
bot.command('jwt', (ctx) => enterMode(ctx, 'jwt'));
bot.command('color', (ctx) => enterMode(ctx, 'color'));
bot.command('html', (ctx) => enterMode(ctx, 'html'));
bot.command('case', (ctx) => enterMode(ctx, 'case'));
bot.command('cron', (ctx) => enterMode(ctx, 'cron'));
bot.command('ua', (ctx) => enterMode(ctx, 'ua'));
bot.command('jsonpath', (ctx) => enterMode(ctx, 'jsonpath'));
bot.command('md', (ctx) => enterMode(ctx, 'md'));
bot.command('regex', (ctx) => enterMode(ctx, 'regex'));
bot.command('uuid', (ctx) => {
  const arg = ctx.message.text.replace(/^\/uuid\s*/, '').trim();
  const list = tools.generateUUID(arg);
  return ctx.reply('🆔 UUID 生成结果：\n\n' + list.join('\n'));
});
bot.command('password', (ctx) => {
  const arg = ctx.message.text.replace(/^\/password\s*/, '').trim();
  return ctx.reply('🔐 随机密码：\n\n' + tools.generatePassword(arg));
});

function formatObject(obj) {
  return JSON.stringify(obj, null, 2);
}

async function handleSession(ctx, session, text, trimmedText, chatId) {
  switch (session.mode) {
    case 'format_json': {
      const formatted = tools.formatJson(text);
      if (formatted.startsWith('❌')) return ctx.reply(formatted);
      userSessions.delete(chatId);
      return ctx.reply('✅ 格式化结果：\n\n' + formatted);
    }
    case 'minify_json': {
      const minified = tools.minifyJson(text);
      if (minified.startsWith('❌')) return ctx.reply(minified);
      userSessions.delete(chatId);
      return ctx.reply('✅ 压缩结果：\n\n' + minified);
    }
    case 'hash': {
      const hashes = tools.calculateHash(text);
      userSessions.delete(chatId);
      return ctx.reply(`🔒 Hash 计算结果：\n\nMD5: ${hashes.md5}\nSHA1: ${hashes.sha1}\nSHA256: ${hashes.sha256}`);
    }
    case 'base64': {
      const result = tools.isBase64(trimmedText) ? '🔗 解码结果：\n\n' + tools.base64Decode(trimmedText) : '🔗 编码结果：\n\n' + tools.base64Encode(text);
      userSessions.delete(chatId);
      return ctx.reply(result);
    }
    case 'qr': {
      if (!trimmedText) return ctx.reply('❌ 二维码内容不能为空，请发送文本或 URL。');
      if (trimmedText.length > QR_TEXT_LIMIT) return ctx.reply(`❌ 内容过长，二维码内容请控制在 ${QR_TEXT_LIMIT} 个字符以内。`);
      const qrBuffer = await tools.generateQRCodeBuffer(trimmedText);
      userSessions.delete(chatId);
      return ctx.replyWithPhoto({ source: qrBuffer }, { caption: '✅ 二维码已生成' });
    }
    case 'time': {
      const info = tools.convertTimeInput(trimmedText);
      userSessions.delete(chatId);
      return ctx.reply(formatTimeInfoMessage('✅ 时间转换结果', info));
    }
    case 'url': {
      const result = tools.urlTool(text);
      userSessions.delete(chatId);
      return ctx.reply(`🌐 URL 编解码结果：\n\nEncoded:\n${result.encoded}\n\nDecoded:\n${result.decoded}`);
    }
    case 'jwt': {
      const result = tools.decodeJwt(trimmedText);
      userSessions.delete(chatId);
      return ctx.reply('🎫 JWT 解码结果：\n\nHeader:\n' + formatObject(result.header) + '\n\nPayload:\n' + formatObject(result.payload) + `\n\nSignature: ${result.signaturePresent ? '存在' : '不存在'}`);
    }
    case 'color': {
      const result = tools.colorTool(trimmedText);
      userSessions.delete(chatId);
      return ctx.reply(`🎨 颜色转换结果：\n\nHEX: ${result.hex}\nRGB: ${result.rgb}\nHSL: ${result.hsl}`);
    }
    case 'html': {
      const result = tools.htmlTool(text);
      userSessions.delete(chatId);
      return ctx.reply(`🏷️ HTML 转义结果：\n\nEscaped:\n${result.escaped}\n\nUnescaped:\n${result.unescaped}`);
    }
    case 'case': {
      const result = tools.caseTool(text);
      userSessions.delete(chatId);
      return ctx.reply('🔤 命名转换结果：\n\n' + Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n'));
    }
    case 'cron': {
      const result = tools.explainCron(trimmedText);
      userSessions.delete(chatId);
      return ctx.reply('🕒 Cron 解释：\n\n' + result.join('\n'));
    }
    case 'ua': {
      const result = tools.parseUserAgent(text);
      userSessions.delete(chatId);
      return ctx.reply(`🧭 UA 解析结果：\n\nBrowser: ${result.browser}\nOS: ${result.os}\nDevice: ${result.device}`);
    }
    case 'jsonpath': {
      const result = tools.jsonPathTool(text);
      userSessions.delete(chatId);
      return ctx.reply('🔎 JSONPath 查询结果：\n\n' + (typeof result === 'string' ? result : formatObject(result)));
    }
    case 'md': {
      const result = tools.escapeMarkdownV2(text);
      userSessions.delete(chatId);
      return ctx.reply('📝 MarkdownV2 转义结果：\n\n' + result);
    }
    case 'regex': {
      const result = tools.regexTool(text);
      userSessions.delete(chatId);
      return ctx.reply('🔍 Regex 匹配结果：\n\n' + (result.length ? result.map(item => `index ${item.index}: ${item.match}`).join('\n') : '无匹配'));
    }
    default:
      return ctx.reply('未知会话，请重新选择工具。');
  }
}

bot.on('text', async (ctx) => {
  cleanupExpiredSessions();

  const text = ctx.message.text;
  const trimmedText = text.trim();
  const chatId = ctx.message.chat.id;

  if (trimmedText === '📄 JSON 工具') return sendResponse(ctx, '📄 JSON 工具\n\n/indent - JSON 格式化\n/minify - JSON 压缩');
  if (trimmedText === '🔒 Hash 工具') return enterMode(ctx, 'hash');
  if (trimmedText === '🔗 Base64') return enterMode(ctx, 'base64');
  if (trimmedText === '🖼️ QR 生成') return enterMode(ctx, 'qr');
  if (trimmedText === '⏱️ 时间工具') return showTime(ctx);
  if (trimmedText === '🧰 更多工具') return showTools(ctx);
  if (trimmedText === 'ℹ️ 关于') return showAbout(ctx);

  const session = getValidSession(chatId);
  if (session) {
    try {
      return await handleSession(ctx, session, text, trimmedText, chatId);
    } catch (e) {
      return ctx.reply('❌ ' + e.message);
    }
  }

  if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
    const formatted = tools.formatJson(text);
    return ctx.reply(formatted.startsWith('❌') ? formatted : '✅ JSON 解析成功：\n\n' + formatted);
  }

  if (text.length < 1000) {
    const hashes = tools.calculateHash(text);
    return ctx.reply(`🔒 Hash 计算结果：\n\nMD5: ${hashes.md5}\nSHA1: ${hashes.sha1}\nSHA256: ${hashes.sha256}`);
  }

  return ctx.reply('请使用 /tools 查看可用命令。');
});

bot.catch((err) => {
  console.error('❌ 错误:', err);
});

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (req.query && req.query.setup === 'webhook') {
        const url = req.query.url || 'https://codetools-bot.vercel.app';
        try {
          const result = await bot.telegram.setWebhook(url);
          const info = await bot.telegram.getWebhookInfo();
          res.status(200).json({ status: 'ok', webhook_set: result, webhook_info: info });
        } catch (err) {
          res.status(500).json({ status: 'error', error: err.message });
        }
        return;
      }
      res.status(200).json({ status: 'ok', message: 'CodeTools Bot is running' });
      return;
    }

    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'ok' });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
};
