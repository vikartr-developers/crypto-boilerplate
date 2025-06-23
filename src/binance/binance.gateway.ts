import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as WebSocket from 'ws'; 

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BinanceGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private wsMap: Map<string, WebSocket> = new Map();
  private clientStreams: Map<string, Map<string, WebSocket>> = new Map();

  afterInit() {
    console.log('Binance Gateway Initialized');
  }

  @SubscribeMessage('subscribe-binance')
  handleSubscribeBinance(
    @MessageBody() rawPayload: any,
    @ConnectedSocket() client: Socket,
  ) {
    let payload;
    try {
      payload =
        typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return;
    }

    const clientId = client.id;
    const { symbol } = payload;
    const lowerSymbol = symbol.toLowerCase();
    const wsUrl = `${process.env.BINANCE_WS_URL}/${lowerSymbol}@trade`;

    let streams = this.clientStreams.get(clientId);
    if (!streams) {
      streams = new Map<string, WebSocket>();
      this.clientStreams.set(clientId, streams);
    }

    if (streams.has(lowerSymbol)) {
      const existingWS = streams.get(lowerSymbol);
      if (existingWS && existingWS.readyState === WebSocket.OPEN) {
        existingWS.terminate();
        streams.delete(lowerSymbol);
        console.log(`Force closed existing WebSocket for ${lowerSymbol}`);
      }
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`Connected to Binance for ${lowerSymbol}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data.toString());
      const trade = {
        symbol: data.s,
        price: data.p,
        quantity: data.q,
        time: data.T,
      };
      client.emit('binance-trade', trade);
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for ${lowerSymbol}`);
      streams?.delete(lowerSymbol);
    };

    ws.onerror = (err) => {
      console.error(`WebSocket error for ${lowerSymbol}`, err);
      streams?.delete(lowerSymbol);
    };

    streams.set(lowerSymbol, ws);
  }

  @SubscribeMessage('unsubscribe-binance')
  handleUnsubscribeBinance(@MessageBody() payload: any) {
    const { symbol } = payload;
    const lowerSymbol = symbol.toLowerCase();

    const ws = this.wsMap.get(lowerSymbol);
    if (ws) {
      console.log(`Unsubscribing WebSocket for ${lowerSymbol}`);
      ws.close();
    }
  }
}


