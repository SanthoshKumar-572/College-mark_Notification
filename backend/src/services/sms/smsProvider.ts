import axios from 'axios';

export interface SMSSendResult {
  success: boolean;
  providerMessageId?: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  errorMessage?: string;
  rawResponse?: any;
}

export class SMSProvider {
  private apiKey: string;
  private senderId: string;
  private templateId: string;
  private isMock: boolean;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || 'ABCENG';
    this.templateId = process.env.SMS_TEMPLATE_ID || '';
    this.isMock = (process.env.MOCK_NOTIFICATION_PROVIDER || 'true').toLowerCase() === 'true';
  }

  public async sendMessage(to: string, messageText: string): Promise<SMSSendResult> {
    // Sanitize phone number (strip +91 or non-digits, keep 10-digit number for Indian SMS gateways)
    let cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      cleanNumber = cleanNumber.substring(2);
    }

    if (this.isMock) {
      const mockId = `SMS-MSG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      console.log(`[SMS MOCK] To: ${cleanNumber} | Sender: ${this.senderId} | Body: ${messageText}`);

      return {
        success: true,
        providerMessageId: mockId,
        status: 'SENT',
        rawResponse: { mock: true, recipient: cleanNumber, timestamp: new Date().toISOString() }
      };
    }

    // Real Indian SMS Gateway (supports standard DLT gateway format e.g. Fast2SMS)
    try {
      // Fast2SMS / MSG91 HTTP API interface
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'dlt',
          sender_id: this.senderId,
          message: [this.templateId],
          variables_values: messageText,
          flash: 0,
          numbers: cleanNumber
        },
        {
          headers: {
            'authorization': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const isSuccess = response.data?.return === true || response.data?.status === 'success';
      const messageId = response.data?.request_id || response.data?.message_id || `SMS-${Date.now()}`;

      return {
        success: isSuccess,
        providerMessageId: messageId,
        status: isSuccess ? 'SENT' : 'FAILED',
        errorMessage: isSuccess ? undefined : (response.data?.message || 'SMS Gateway reported failure'),
        rawResponse: response.data
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'SMS provider network error';
      console.error('[SMS Provider Error]:', errMsg);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: errMsg,
        rawResponse: err.response?.data
      };
    }
  }
}

export const smsProvider = new SMSProvider();
