import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/api/socket',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RealtimeGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) {
        this.logger.warn(`连接拒绝: 缺少 token, clientId=${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.join(`user_${userId}`);
      client.data.userId = userId;
      this.logger.log(`用户已连接: userId=${userId}, clientId=${client.id}`);
    } catch (e) {
      this.logger.warn(`连接拒绝: token无效, clientId=${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.logger.log(`用户已断开: userId=${client.data.userId}, clientId=${client.id}`);
    }
  }

  /**
   * 推送工单更新事件
   */
  emitWorkOrderUpdated(userId: number, workOrder: any) {
    this.server.to(`user_${userId}`).emit('work_order.updated', workOrder);
  }

  /**
   * 推送通知创建事件
   */
  emitNotificationCreated(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification.created', notification);
  }
}
