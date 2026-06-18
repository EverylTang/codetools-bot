// Bot 启动测试脚本
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 测试命令
bot.command('test', (ctx) => {
  ctx.reply('✅ Bot 运行正常！');
  console.log('收到测试命令');
});

// 文本消息处理
bot.on('text', (ctx) => {
  console.log('收到消息:', ctx.message.text);
  ctx.reply('收到: ' + ctx.message.text);
});

// 启动
bot.launch()
  .then(() => console.log('✅ Bot 已启动'))
  .catch(err => console.error('❌ 启动失败:', err));

// 退出处理
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
