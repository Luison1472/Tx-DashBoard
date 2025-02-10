import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeHealth } from './node-health';
import { NodeHealthRepository } from './node-health.repository';
import { NodeHealthService } from './node-health.service';
import { TypeOrmExModule } from '../typeorm-ex.module'; // ✅ 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([NodeHealth]), // ✅ `NodeHealth` 추가 (중요)
    TypeOrmExModule.forCustomRepository([NodeHealthRepository]), // ✅ `NodeHealthRepository` 등록
  ],
  providers: [NodeHealthService],
  exports: [NodeHealthService, TypeOrmModule, TypeOrmExModule], // ✅ `TypeOrmModule` & `TypeOrmExModule` 내보내기
})
export class NodeHealthModule {}
