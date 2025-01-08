import { Module } from '@nestjs/common';
import { TypeOrmExModule } from "../typeorm-ex.module";
import { NodeHealthRepository } from "./node-health.repository";
import { NodeHealthService } from "./node-health.service";


@Module({
  imports: [TypeOrmExModule.forCustomRepository([NodeHealthRepository])],
  controllers: [],
  providers: [NodeHealthService],
  exports: [NodeHealthService],
})
export class NodeHealthModule {}