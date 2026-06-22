// Vercel Serverless 入口
const { Telegraf } = require('telegraf');
const tools = require('./utils/tools');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 临时存储用户会话数据
const userSessions = new Map();
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const QR_TEXT_LIMIT = 2000;

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
    if (now - session.timestamp > SESSION_TIMEOUT_MS) {
      userSessions.delete(chatId);
    }
  }
}

// 辅助函数：发送格式化响应
function sendResponse(ctx, message, keyboard = null) {
  if (keyboard) {
    return ctx.reply(message, { resize_keyboard: true, keyboard });
  }
  return ctx.reply(message);
}

function showTools(ctx) {
  return sendResponse(ctx,
    '📋 工具列表\n\n免费功能：\n/indent - JSON 缩进格式化\n/minify - JSON 压缩\n/hash - 计算 Hash\n/base64 - Base64 编解码\n/qr - 生成二维码图片\n/time - 当前时间戳\n\nPremium 功能（订阅后解锁）：\n/batch - 批量处理\n/api - 高速率 API 访问\n/export - 导出 CSV/Excel'
  );
}

function enterJsonTool(ctx) {
  return sendResponse(ctx, '📄 JSON 工具\n\n请使用：\n/indent - JSON 缩进格式化\n/minify - JSON 压缩\n\n你也可以直接发送 JSON，我会自动尝试格式化。');
}

function enterHashTool(ctx) {
  setSession(ctx.message.chat.id, 'hash');
  return sendResponse(ctx, '🔒 Hash 计算\n\n请发送文本，我会计算其 MD5/SHA1/SHA256 哈希值。');
}

function enterBase64Tool(ctx) {
  setSession(ctx.message.chat.id, 'base64');
  return sendResponse(ctx, '🔗 Base64 编解码\n\n请发送文本，我会自动判断并进行 Base64 编码或解码。');
}

function enterQrTool(ctx) {
  setSession(ctx.message.chat.id, 'qr');
  return sendResponse(ctx, '🖼️ QR 生成\n\n请发送文本或 URL，我会生成对应的二维码图片。');
}

// 命令路由
bot.command('start', (ctx) => {
  sendResponse(ctx,
    '👋 欢迎使用 CodeTools Bot！\n\n我是一个开发者工具集合，包含：\n- JSON 格式化/压缩\n- Hash 计算（MD5/SHA1/SHA256）\n- Base64 编解码\n- QR 生成\n- 时间工具\n\n回复 /tools 查看所有工具列表',
    [
      ['📄 JSON 工具', '🔒 Hash 工具'],
      ['🔗 Base64', '🖼️ QR 生成'],
      ['⏱️ 时间工具', 'ℹ️ 关于']
    ]
  );
});

bot.command('tools', showTools);

// JSON 工具
bot.command('indent', (ctx) => {
  setSession(ctx.message.chat.id, 'format_json');
  sendResponse(ctx, '📄 JSON 缩进格式化\n\n请发送 JSON 数据，我会将其格式化为缩进形式。');
});

bot.command('minify', (ctx) => {
  setSession(ctx.message.chat.id, 'minify_json');
  sendResponse(ctx, '压缩 JSON\n\n请发送 JSON 数据，我会将其压缩为一行。');
});

// Hash 计算
bot.command('hash', enterHashTool);

// Base64 编解码
bot.command('base64', enterBase64Tool);

// QR 生成
bot.command('qr', enterQrTool);

// 时间工具
bot.command('time', (ctx) => {
  sendResponse(ctx, '⏱️ 时间工具\n\n当前时间戳：' + Math.floor(Date.now() / 1000));
});

// 关于
bot.command('about', (ctx) => {
  sendResponse(ctx,
    'ℹ️ CodeTools Bot v1.1\n\n一个面向开发者的工具集合 Bot\n支持 JSON、Hash、Base64、二维码和时间戳工具\n\nGitHub: https://github.com/yourname/codetools-bot'
  );
});

// 文本处理
bot.on('text', async (ctx) => {
  cleanupExpiredSessions();

  const text = ctx.message.text;
  const trimmedText = text.trim();
  const chatId = ctx.message.chat.id;

  if (trimmedText === '📄 JSON 工具') return enterJsonTool(ctx);
  if (trimmedText === '🔒 Hash 工具') return enterHashTool(ctx);
  if (trimmedText === '🔗 Base64') return enterBase64Tool(ctx);
  if (trimmedText === '🖼️ QR 生成') return enterQrTool(ctx);
  if (trimmedText === '⏱️ 时间工具') return bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/time' } });
  if (trimmedText === 'ℹ️ 关于') return bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/about' } });

  const session = getValidSession(chatId);

  if (session && session.mode === 'format_json') {
    try {
      const formatted = tools.formatJson(text);
      if (formatted.startsWith('❌')) throw new Error(formatted.replace('❌ JSON格式错误: ', ''));
      ctx.reply('✅ 格式化结果：\n\n```json\n' + formatted + '\n```', { parse_mode: 'MarkdownV2' });
      userSessions.delete(chatId);
    } catch (e) {
      ctx.reply('❌ JSON 格式错误: ' + e.message);
    }
    return;
  }

  if (session && session.mode === 'minify_json') {
    try {
      const minified = tools.minifyJson(text);
      if (minified.startsWith('❌')) throw new Error(minified.replace('❌ JSON格式错误: ', ''));
      ctx.reply('✅ 压缩结果：\n\n```json\n' + minified + '\n```', { parse_mode: 'MarkdownV2' });
      userSessions.delete(chatId);
    } catch (e) {
      ctx.reply('❌ JSON 格式错误: ' + e.message);
    }
    return;
  }

  if (session && session.mode === 'hash') {
    const hashes = tools.calculateHash(text);
    ctx.reply('🔒 Hash 计算结果：\n\nMD5: `' + hashes.md5 + '`\nSHA1: `' + hashes.sha1 + '`\nSHA256: `' + hashes.sha256 + '`', { parse_mode: 'MarkdownV2' });
    userSessions.delete(chatId);
    return;
  }

  if (session && session.mode === 'base64') {
    if (tools.isBase64(trimmedText)) {
      const decoded = tools.base64Decode(trimmedText);
      ctx.reply('🔗 解码结果：\n\n```\n' + decoded + '\n```', { parse_mode: 'MarkdownV2' });
    } else {
      const encoded = tools.base64Encode(text);
      ctx.reply('🔗 编码结果：\n\n```\n' + encoded + '\n```', { parse_mode: 'MarkdownV2' });
    }
    userSessions.delete(chatId);
    return;
  }

  if (session && session.mode === 'qr') {
    if (!trimmedText) {
      ctx.reply('❌ 二维码内容不能为空，请发送文本或 URL。');
      return;
    }

    if (trimmedText.length > QR_TEXT_LIMIT) {
      ctx.reply(`❌ 内容过长，二维码内容请控制在 ${QR_TEXT_LIMIT} 个字符以内。`);
      return;
    }

    try {
      const qrBuffer = await tools.generateQRCodeBuffer(trimmedText);
      await ctx.replyWithPhoto({ source: qrBuffer }, { caption: '✅ 二维码已生成' });
      userSessions.delete(chatId);
    } catch (e) {
      ctx.reply('❌ 二维码生成失败: ' + e.message);
    }
    return;
  }

  if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      ctx.reply('✅ JSON 解析成功！\n\n格式化结果：\n\n```json\n' + JSON.stringify(parsed, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    } catch (e) {
      ctx.reply('❌ 不是有效的 JSON 格式: ' + e.message);
    }
    return;
  }

  if (text.length < 1000) {
    const hashes = tools.calculateHash(text);
    ctx.reply('🔒 Hash 计算结果：\n\nMD5: `' + hashes.md5 + '`\nSHA1: `' + hashes.sha1 + '`\nSHA256: `' + hashes.sha256 + '`', { parse_mode: 'MarkdownV2' });
    return;
  }

  ctx.reply('工具功能开发中...请使用 /tools 查看可用命令');
});

// 错误处理
bot.catch((err) => {
  console.error('❌ 错误:', err);
});

// Vercel Webhook handler
module.exports = async (req, res) => {
  try {
    // GET 请求 - 健康检查
    if (req.method === 'GET') {
      // 检查 setup 参数 - 用于设置 webhook
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

    // POST 请求 - Telegram Webhook
    if (req.method === 'POST') {
      const update = req.body;
      await bot.handleUpdate(update);
      res.status(200).json({ status: 'ok' });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
};
