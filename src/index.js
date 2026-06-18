const { Telegraf, Markup, Context } = require('telegraf');
const tools = require('./utils/tools');
const crypto = require('crypto');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 临时存储用户会话数据（生产环境应使用 Redis）
const userSessions = new Map();

// 辅助函数：发送格式化响应
function sendResponse(ctx, message, keyboard = null) {
  if (keyboard) {
    ctx.reply(message, Markup.keyboard(keyboard).resize());
  } else {
    ctx.reply(message);
  }
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

bot.command('tools', (ctx) => {
  sendResponse(ctx,
    '📋 工具列表\n\n免费功能：\n/indent - JSON 缩进格式化\n/minify - JSON 压缩\n/hash - 计算 Hash\n/base64 - Base64 编解码\n\nPremium 功能（订阅后解锁）：\n/batch - 批量处理\n/api - 高速率 API 访问\n/export - 导出 CSV/Excel'
  );
});

// JSON 工具
bot.command('indent', (ctx) => {
  userSessions.set(ctx.message.chat.id, { mode: 'format_json', timestamp: Date.now() });
  sendResponse(ctx, '📄 JSON 缩进格式化\n\n请发送 JSON 数据，我会将其格式化为缩进形式。');
});

bot.command('minify', (ctx) => {
  userSessions.set(ctx.message.chat.id, { mode: 'minify_json', timestamp: Date.now() });
  sendResponse(ctx, '压缩 JSON\n\n请发送 JSON 数据，我会将其压缩为一行。');
});

// Hash 计算
bot.command('hash', (ctx) => {
  userSessions.set(ctx.message.chat.id, { mode: 'hash', timestamp: Date.now() });
  sendResponse(ctx, '🔒 Hash 计算\n\n请发送文本，我会计算其 MD5/SHA1/SHA256 哈希值。');
});

// Base64 编解码
bot.command('base64', (ctx) => {
  userSessions.set(ctx.message.chat.id, { mode: 'base64', timestamp: Date.now() });
  sendResponse(ctx, '🔗 Base64 编解码\n\n请发送文本，我会进行 Base64 编码或解码。');
});

// QR 生成
bot.command('qr', (ctx) => {
  userSessions.set(ctx.message.chat.id, { mode: 'qr', timestamp: Date.now() });
  sendResponse(ctx, '🖼️ QR 生成\n\n请发送文本或 URL，我会生成对应的二维码图片。\n\n（功能开发中，当前返回文本）');
});

// 时间工具
bot.command('time', (ctx) => {
  sendResponse(ctx, '⏱️ 时间工具\n\n当前时间戳：' + Math.floor(Date.now() / 1000));
});

// 关于
bot.command('about', (ctx) => {
  sendResponse(ctx,
    'ℹ️ CodeTools Bot v1.0\n\n一个面向开发者的工具集合 Bot\n支持 Premium 订阅，解锁高级功能\n\nGitHub: https://github.com/yourname/codetools-bot'
  );
});

// 文本处理 - 真实工具逻辑
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.message.chat.id;
  const session = userSessions.get(chatId);
  
  // 处理 JSON 格式化
  if (session && session.mode === 'format_json') {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      ctx.reply('✅ 格式化结果：\n\n```json\n' + formatted + '\n```', { parse_mode: 'MarkdownV2' });
      userSessions.delete(chatId);
    } catch (e) {
      ctx.reply('❌ JSON 格式错误: ' + e.message);
    }
    return;
  }
  
  // 处理 JSON 压缩
  if (session && session.mode === 'minify_json') {
    try {
      const parsed = JSON.parse(text);
      const minified = JSON.stringify(parsed);
      ctx.reply('✅ 压缩结果：\n\n```json\n' + minified + '\n```', { parse_mode: 'MarkdownV2' });
      userSessions.delete(chatId);
    } catch (e) {
      ctx.reply('❌ JSON 格式错误: ' + e.message);
    }
    return;
  }
  
  // 处理 Hash 计算
  if (session && session.mode === 'hash') {
    const hashes = tools.calculateHash(text);
    ctx.reply('🔒 Hash 计算结果：\n\nMD5: `' + hashes.md5 + '`\nSHA1: `' + hashes.sha1 + '`\nSHA256: `' + hashes.sha256 + '`', { parse_mode: 'MarkdownV2' });
    userSessions.delete(chatId);
    return;
  }
  
  // 处理 Base64 编解码
  if (session && session.mode === 'base64') {
    if (tools.isBase64(text)) {
      const decoded = tools.base64Decode(text);
      ctx.reply('🔗 解码结果：\n\n```\n' + decoded + '\n```', { parse_mode: 'MarkdownV2' });
    } else {
      const encoded = tools.base64Encode(text);
      ctx.reply('🔗 编码结果：\n\n```\n' + encoded + '\n```', { parse_mode: 'MarkdownV2' });
    }
    userSessions.delete(chatId);
    return;
  }
  
  // 默认 JSON 处理
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      ctx.reply('✅ JSON 解析成功！\n\n格式化结果：\n\n```json\n' + JSON.stringify(parsed, null, 2) + '\n```', { parse_mode: 'MarkdownV2' });
    } catch (e) {
      ctx.reply('❌ 不是有效的 JSON 格式: ' + e.message);
    }
    return;
  }
  
  // 默认 Hash 处理
  if (text.length < 1000) {
    const hashes = tools.calculateHash(text);
    ctx.reply('🔒 Hash 计算结果：\n\nMD5: `' + hashes.md5 + '`\nSHA1: `' + hashes.sha1 + '`\nSHA256: `' + hashes.sha256 + '`', { parse_mode: 'MarkdownV2' });
    return;
  }
  
  // 默认提示
  ctx.reply('工具功能开发中...请使用 /tools 查看可用命令');
});

// 清理超时会话（10分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of userSessions.entries()) {
    if (now - session.timestamp > 600000) {
      userSessions.delete(key);
    }
  }
}, 60000);

// 错误处理
bot.catch((err) => {
  console.error('❌ 错误:', err);
});

// 启动 Bot
bot.launch();
console.log('✅ Bot 已启动');

module.exports = bot;
