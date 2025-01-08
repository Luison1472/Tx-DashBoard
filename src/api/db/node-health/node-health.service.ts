import { NodeHealthRepository } from "./node-health.repository";
import { Injectable } from "@nestjs/common";
import {NodeHealth} from "./node-health";
import { Not, Between, In, MoreThanOrEqual} from "typeorm"

@Injectable()
export class NodeHealthService {
  constructor(private readonly nodeHealthRepository: NodeHealthRepository) {}

  async saveTempTx(group_name: string, endpoint_url: string, timeStamp: Date): Promise<void> {
    const nodeHealth = new NodeHealth();
    nodeHealth.timeStamp = timeStamp;
    nodeHealth.group_name = group_name;
    nodeHealth.endpoint_url = endpoint_url;
    nodeHealth.active = 'temp';
    try {
      console.log(await this.nodeHealthRepository.save(nodeHealth))
    } catch (error) {
      console.error(error);
    }
  }

  async updateTempTx(endpoint_url: string, txHash: string, timeStamp: Date): Promise<void> {
    const nodeHealth = await this.getTempTransactions(endpoint_url, timeStamp)
    nodeHealth.txHash = txHash;
    nodeHealth.active = 'pending';
    try {
      console.log(await this.nodeHealthRepository.save(nodeHealth));
    } catch (error) {
      console.error(error);
    }
  }

  async updateFailedTempTx(endpoint_url: string, txHash: string, timeStamp: Date): Promise<void> {
    const nodeHealth = await this.getTempTransactions(endpoint_url, timeStamp)
    nodeHealth.txHash = txHash;
    nodeHealth.active = 'false';
    try {
      await this.nodeHealthRepository.save(nodeHealth);
    } catch (error) {
      console.error(error);
    }
  }

  async getStatus() {
    const now = new Date();
    const oneMonthsAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let nodeHealths = await this.nodeHealthRepository.find({
      where: {
        timeStamp: MoreThanOrEqual(oneMonthsAgo),
        active: "false"
      }
    });

    const odinNodes = nodeHealths.filter(nodeHealth => nodeHealth.group_name === 'odin')
        .map(n => {
          n.timeStamp = new Date(n.timeStamp.getTime()); // 9시간 추가
          return n;
        });

    const heimdallNodes = nodeHealths.filter(nodeHealth => nodeHealth.group_name === 'heimdall')
        .map(n => {
          n.timeStamp = new Date(n.timeStamp.getTime()); // 9시간 추가
          return n;
        });
    return { "odin": odinNodes, "heimdall": heimdallNodes };
  }

  async getDetail(group: string, startTimeStamp: string, endTimeStamp: string) {
    const startDate = new Date(startTimeStamp);
    const endDate = new Date(endTimeStamp);
    let nodeHealths = await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(startDate , endDate),
        active: "false",
        group_name: group //순서 고려해보자 인덱스
      }
    });
    return nodeHealths;
  }

  async getLost(group: string, startTimeStamp: string, endTimeStamp: string) {
    const startDate = new Date(startTimeStamp);
    let endDate = new Date(endTimeStamp);
    endDate.setDate(endDate.getDate() + 1);
    const now = new Date();
    if(endDate >= now)
      endDate = now;

    let nodeHealths = await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(startDate , endDate),
        group_name: group, //순서 고려해보자 인덱스
        active: 'temp'
      }
    });
    return nodeHealths;
  }

  async getLostDetail(group: string, startTimeStamp: string, endTimeStamp: string) {
    const startDate = new Date(startTimeStamp);
    const endDate = new Date(endTimeStamp);
    let nodeHealths = await this.nodeHealthRepository.find({
      where: {
        timeStamp: Between(startDate , endDate),
        group_name: group,
        active: 'temp'
      }
    });
    return nodeHealths;
  }

  async getDistinctEndpoints(): Promise<string[]> {
    return await this.nodeHealthRepository
        .createQueryBuilder('node_health')
        .select('DISTINCT endpoint_url')
        .where('id >= :id', { id: 1 })
        .getRawMany()
        .then((results) => results.map((result) => result.endpoint_url));
  }

  async getPendingTransactions() {
    return await this.nodeHealthRepository.find({
      where: { active: In(["pending", "staging"]) },
      select: ["id", "endpoint_url", "txHash"], // 필요한 필드만 선택
    });
  }

  async getTempTransactions(endpoint_url: string, timestamp: Date) {
    return await this.nodeHealthRepository.findOne({
      where: { active: "temp", timeStamp: timestamp, endpoint_url: endpoint_url },
    });
  }


  async updateCompletedTx(id:number): Promise<void> {
    await this.nodeHealthRepository.update(id, { active: 'true' });
  }

  async updateStagingTx(id:number): Promise<void> {
    await this.nodeHealthRepository.update(id, { active: 'staging' });
  }

  async updateFailedTx(id:number, log): Promise<void> {
    await this.nodeHealthRepository.update(id, { active: 'false', log: log });
  }
}