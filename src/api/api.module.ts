import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { NodeHealthModule } from "./db/node-health/node-health.module";
import { NodeHealth } from "./db/node-health/node-health";
import { ServeStaticModule } from "@nestjs/serve-static";
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
      host: 'ninechronicle-monitor.cfwwueuwspfo.ap-northeast-2.rds.amazonaws.com',
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'node_health',
      entities: [NodeHealth],
      synchronize: true,
    }),
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   password: 'rootroot',
    //   database: 'nodehealth',
    //   entities: [NodeHealth],
    //   synchronize: true,
    // }),
    HttpModule,
    NodeHealthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..','public'), // Serve from the 'public' directory
    }),
  ],
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService]
})
export class ApiModule {}
