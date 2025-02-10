import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeHealthModule } from './db/node-health/node-health.module';
import { NodeHealth } from './db/node-health/node-health';  // ✅ 추가 (엔터티 import)
import { ServeStaticModule } from '@nestjs/serve-static';
import { NodeHealthCron } from './db/node-health/node-health.cron';
import { NodeHealthService } from './db/node-health/node-health.service';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: false,
      envFilePath: '.development.env',
    }),
    TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT), // ✅ `.env`의 DB_PORT 값을 사용
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [NodeHealth],
  synchronize: false,
})
,
    HttpModule,
    NodeHealthModule, // ✅ `NodeHealthModule`을 imports에 추가
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'public'),
    }),
  ],
  controllers: [ApiController],
  providers: [ApiService, NodeHealthService, NodeHealthCron],
  exports: [ApiService],
})
export class ApiModule {}
