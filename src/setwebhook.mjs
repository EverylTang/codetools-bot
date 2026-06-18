// 设置 Webhook
import 'dotenv/config';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEBHOOK_URL = 'https://codetools-bot.vercel.app';

try {
  const result = await bot.telegram.setWebhook(WEBHOOK_URL);
  console.log('✅ Webhook 设置成功:', result);

  const info = await bot.telegram.getWebhookInfo();
  console.log('Webhook 状态:', JSON.stringify(info, null, 2));
} catch (err) {
  console.error('❌ Webhook 设置失败:', err.message);
}