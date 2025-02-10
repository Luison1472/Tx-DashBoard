import { NodeHealthRepository } from "./node-health.repository";
import { Injectable, Logger } from "@nestjs/common";
import { NodeHealth } from "./node-health";
import { Not, Between, In, MoreThanOrEqual } from "typeorm";

@Injectable()
export class NodeHealthService {
  private readonly logger = new Logger(NodeHealthService.name);

  constructor(private readonly nodeHealthRepository: NodeHealthRepository) {}

  async saveTempTx(group_name: string, endpoint_url: string, timeStamp: Date): Promise<void> {
    const nodeHealth = new NodeHealth();
    nodeHealth.timeStamp = timeStamp;
    nodeHealth.group_name = group_name;
    nodeHealth.endpoint_url = endpoint_url;
    nodeHealth.active = "temp";
    nodeHealth.txHash = "UNKNOWN"; // ✅ 기본값을 빈 문자열("") 대신 "UNKNOWN"으로 설정

    try {
      this.logger.log(`📝 Saving temp transaction: ${JSON.stringify(nodeHealth)}`);
      console.log(await this.nodeHealthRepository.save(nodeHealth));
    } catch (error) {
      this.logger.error(`❌ Error saving temp transaction: ${error.message}`);
    }
  }

  async updateTempTx(endpoint_url: string, txHash: string, timeStamp: Date): Promise<void> {
    const nodeHealth = await this.getTempTransactions(endpoint_url, timeStamp);
    if (!nodeHealth) {
      this.logger.warn(`⚠️ No temp transaction found for ${endpoint_url} at ${timeStamp}`);
      return;
    }

    if (nodeHealth.txHash && nodeHealth.txHash !== "UNKNOWN") {
      this.logger.warn(`⚠️ 트랜잭션 이미 존재: ${nodeHealth.txHash}, 덮어쓰지 않음`);
      return;
    }

    nodeHealth.txHash = txHash || "UNKNOWN"; // ✅ 기본값 처리
    nodeHealth.active = "pending";
    try {
      this.logger.log(`🔄 Updating temp transaction to pending: ${JSON.stringify(nodeHealth)}`);
      console.log(await this.nodeHealthRepository.save(nodeHealth));
    } catch (error) {
      this.logger.error(`❌ Error updating temp transaction: ${error.message}`);
    }
  }

  async updateFailedTempTx(endpoint_url: string, txHash: string, timeStamp: Date): Promise<void> {
    const nodeHealth = await this.getTempTransactions(endpoint_url, timeStamp);
    if (!nodeHealth) {
      this.logger.warn(`⚠️ No temp transaction found for ${endpoint_url} at ${timeStamp}`);
      return;
    }

    nodeHealth.txHash = txHash;
    nodeHealth.active = 'false';
    try {
      await this.nodeHealthRepository.save(nodeHealth);
    } catch (error) {
      this.logger.error(`❌ Error updating failed temp transaction: ${error.message}`);
    }
  }

  async getStatus() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let nodeHealths = await this.nodeHealthRepository.find({
      where: {
        timeStamp: MoreThanOrEqual(oneMonthAgo),
        active: "false",
      },
    });

    const odinNodes = nodeHealths
      .filter(nodeHealth => nodeHealth.group_name === 'odin')
      .map(n => ({ ...n, timeStamp: new Date(n.timeStamp.getTime()) }));

    const heimdallNodes = nodeHealths
      .filter(nodeHealth => nodeHealth.group_name === 'heimdall')
      .map(n => ({ ...n, timeStamp: new Date(n.timeStamp.getTime()) }));

    return { odin: odinNodes, heimdall: heimdallNodes };
  }

  async getDetail(group: string, startTimeStamp: string, endTimeStamp: string) {
    return await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(new Date(startTimeStamp), new Date(endTimeStamp)),
        active: "false",
        group_name: group,
      },
    });
  }

  async getLost(group: string, startTimeStamp: string, endTimeStamp: string) {
    let endDate = new Date(endTimeStamp);
    endDate.setDate(endDate.getDate() + 1);
    if (endDate >= new Date()) endDate = new Date();

    return await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(new Date(startTimeStamp), endDate),
        group_name: group,
        active: 'temp',
      },
    });
  }

  async getLostDetail(group: string, startTimeStamp: string, endTimeStamp: string) {
    return await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(new Date(startTimeStamp), new Date(endTimeStamp)),
        group_name: group,
        active: 'temp',
      },
    });
  }

  async getDistinctEndpoints(): Promise<string[]> {
    return await this.nodeHealthRepository
      .createQueryBuilder("node_health")
      .select("DISTINCT node_health.endpoint_url", "endpoint_url")
      .where("node_health.id >= :id", { id: 1 })
      .getRawMany()
      .then(results => results.map(result => result.endpoint_url));
  }

  async getPendingTransactions() {
    return await this.nodeHealthRepository.find({
      where: { active: In(["pending", "staging"]) },
      select: ["id", "endpoint_url", "txHash"],
    });
  }

  async getTempTransactions(endpoint_url: string, timestamp: Date) {
    return await this.nodeHealthRepository.findOne({
      where: { active: "temp", timeStamp: timestamp, endpoint_url: endpoint_url },
    });
  }

  async updateCompletedTx(id: number): Promise<void> {
    const existing = await this.nodeHealthRepository.findOne({ where: { id } });
    if (!existing) {
      this.logger.warn(`⚠️ Cannot update completed: Transaction ${id} not found`);
      return;
    }

    await this.nodeHealthRepository.update(id, { active: 'true' });
  }

  async updateCompletedTxBatch(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    try {
        await this.nodeHealthRepository
            .createQueryBuilder()
            .update(NodeHealth)
            .set({ active: 'true' })
            .where("id IN (:...ids)", { ids })
            .execute();

        console.log(`✅ Batch update: ${ids.length} transactions marked as completed.`);
    } catch (error) {
        console.error(`❌ Batch update failed: ${error.message}`);
    }
  }
  
   async updateFailedTxBatch(ids: number[], logMessages: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      await this.nodeHealthRepository
        .createQueryBuilder()
        .update(NodeHealth)
        .set({
          active: "false",
          log: logMessages.length ? logMessages.join(", ") : "No log available", // ✅ 로그 개별 업데이트
        })
        .where("id IN (:...ids)", { ids })
        .execute();

      console.log(`✅ Batch update: ${ids.length} transactions marked as failed.`);
    } catch (error) {
      console.error(`❌ Batch update failed: ${error.message}`);
    }
  
}

  async updateStagingTxBatch(ids: number[]): Promise<void> {
    if (ids.length === 0) return; // ✅ 업데이트할 대상이 없으면 실행 안 함

    try {
        await this.nodeHealthRepository
            .createQueryBuilder()
            .update(NodeHealth)
            .set({ active: 'staging' })
            .where("id IN (:...ids)", { ids })
            .execute();

        console.log(`✅ Batch update: ${ids.length} transactions marked as staging.`);
    } catch (error) {
        console.error(`❌ Batch update failed: ${error.message}`);
    }
}

 async updateFailedTx(ids: number[], logMessages: string[]): Promise<void> {
    if (ids.length === 0) return; // ✅ 업데이트할 대상이 없으면 실행 안 함

    try {
        await this.nodeHealthRepository
            .createQueryBuilder()
            .update(NodeHealth)
            .set({ active: 'false', log: () => `VALUES(log)` }) // ✅ 로그 개별 업데이트
            .where("id IN (:...ids)", { ids })
            .execute();

        console.log(`✅ Batch update: ${ids.length} transactions marked as failed.`);
    } catch (error) {
        console.error(`❌ Batch update failed: ${error.message}`);
    }
}



}
