import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class BinanceService {
  private apiKey = process.env.BINANCE_API_KEY;
  private secretKey = process.env.BINANCE_SECRET_KEY;
  private baseUrl = process.env.BINANCE_BASE_URL;

  private sign(queryString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey!)
      .update(queryString)
      .digest('hex');
  }

  async getAccountInfo(): Promise<any> {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = this.sign(query);
    const url = `${this.baseUrl}/api/v3/account?${query}&signature=${signature}`;

    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey },
    });

    return response.data;
  }
}
