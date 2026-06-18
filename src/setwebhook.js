// 设置 Webhook - 通过本地运行设置
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('检查当前 Webhook 状态...');
    const info = await bot.telegram.getWebhookInfo();
    console.log('当前状态:', JSON.stringify(info, null, 2));

    console.log('设置 Webhook 到: https://codetools-bot.vercel.app');
    const result = await bot.telegram.setWebhook('https://codetools-bot.vercel.app');
    console.log('设置结果:', result);

    const newInfo = await bot.telegram.getWebhookInfo();
    console.log('更新后状态:', JSON.stringify(newInfo, null, 2));
  } catch (err) {
    console.error('失败:', err);
  } finally {
    process.exit(0);
  }
})();