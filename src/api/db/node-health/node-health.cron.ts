import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { ApiService } from '../../api.service';

@Injectable()
export class NodeHealthCron implements OnModuleInit {
  private readonly logger = new Logger(NodeHealthCron.name);

  constructor(private readonly apiService: ApiService) {}

  async onModuleInit() {
    await this.startCronJobs();
  }

  async startCronJobs() {
    this.logger.log('✅ CronJob 설정 완료!');

    // 1분마다 트랜잭션 전송 (매분 0초에 실행)
    cron.schedule('* * * * *', async () => {
      this.logger.log('🔄 1분마다 트랜잭션 전송 시작');

      try {
        // 엔드포인트 정보 가져오기
        const [odinRPCEndpoints, heimdallRPCEndpoints] = await this.apiService.getRPCEndPoints();

        // 공통 타임스탬프 생성
        const commonTimestamp = new Date();
        commonTimestamp.setSeconds(0, 0);
        commonTimestamp.setHours(commonTimestamp.getHours() + 9);

        // 트랜잭션 저장 및 전송
        await this.apiService.saveTemp('odin', odinRPCEndpoints, commonTimestamp);
        await this.apiService.saveTemp('heimdall', heimdallRPCEndpoints, commonTimestamp);
        await this.apiService.send('odin', odinRPCEndpoints, commonTimestamp);
        await this.apiService.send('heimdall', heimdallRPCEndpoints, commonTimestamp);
      } catch (error) {
        this.logger.error('❌ 트랜잭션 전송 중 오류 발생:', error);
      }
    });

    // 1분마다 트랜잭션 상태 확인 (매분 30초에 실행)
    cron.schedule('30 * * * * *', async () => {
      this.logger.log('🔎 1분마다 트랜잭션 상태 확인');
      try {
        await this.apiService.resolvePendingTransactions();
      } catch (error) {
        this.logger.error('❌ 트랜잭션 확인 중 오류 발생:', error);
      }
    });
  }
}
