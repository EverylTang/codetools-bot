// Webhook 配置工具
// 用于配置 Telegram Bot 的 Webhook

const TelegramBot = require('telegraf');

async function setWebhook(token, url) {
  const bot = new TelegramBot(token);
  try {
    const result = await bot.telegram.setWebhook(url);
    console.log('Webhook 设置结果:', result);
  } catch (err) {
    console.error('设置 Webhook 失败:', err);
  }
}

async function deleteWebhook(token) {
  const bot = new TelegramBot(token);
  try {
    const result = await bot.telegram.deleteWebhook();
    console.log('Webhook 删除结果:', result);
  } catch (err) {
    console.error('删除 Webhook 失败:', err);
  }
}

module.exports = { setWebhook, deleteWebhook };
