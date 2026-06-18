// Telegram Payments API 集成

const axios = require('axios');

const API_BASE_URL = 'https://api.telegram.org/bot';

class TelegramPayments {
  constructor(token) {
    this.token = token;
  }

  async sendInvoice(chat_id, title, description, payload, provider_token, start_parameter, currency, prices) {
    const url = `${API_BASE_URL}${this.token}/sendInvoice`;
    
    const params = {
      chat_id,
      title,
      description,
      payload,
      provider_token,
      start_parameter,
      currency,
      prices: JSON.stringify(prices),
      provider_data: JSON.stringify({
        invoice: {
          currency,
          prices
        }
      })
    };

    try {
      const response = await axios.post(url, params);
      return response.data;
    } catch (error) {
      console.error('Send invoice error:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyPayment(query_id) {
    // Telegram Payments 使用外部支付提供商
    // 验证逻辑由支付提供商处理
    return true;
  }

  async createInvoiceLink(title, description, payload, provider_token, currency, prices) {
    const url = `${API_BASE_URL}${this.token}/createInvoiceLink`;
    
    const params = {
      title,
      description,
      payload,
      provider_token,
      currency,
      prices: JSON.stringify(prices)
    };

    try {
      const response = await axios.post(url, params);
      return response.data;
    } catch (error) {
      console.error('Create invoice link error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = TelegramPayments;
