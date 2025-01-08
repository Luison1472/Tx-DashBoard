import { Controller, Get, Query } from "@nestjs/common";
import { ApiService } from "./api.service";
import {NodeHealthService} from "./db/node-health/node-health.service";


@Controller('/api')
export class ApiController {
  constructor(private readonly apiService: ApiService, private readonly nodeHealthService: NodeHealthService) {}

  @Get('/endpoint')
  async getRpcEndPoints() {
    return await this.apiService.getRPCEndPoints();
  }

  @Get('/send')
  async send() {
    const [ odinRPCEndpoints, heimdallRPCEndpoints ] = await this.apiService.getRPCEndPoints();
    const commonTimestamp = new Date();
    commonTimestamp.setSeconds(0, 0);
    commonTimestamp.setHours(commonTimestamp.getHours() + 9);
    await this.apiService.saveTemp('odin', odinRPCEndpoints, commonTimestamp)
    await this.apiService.saveTemp('heimdall', heimdallRPCEndpoints, commonTimestamp)
    await this.apiService.send('odin', odinRPCEndpoints, commonTimestamp);
    await this.apiService.send('heimdall', heimdallRPCEndpoints, commonTimestamp);
  }

  @Get('/check')
  async checkTx() {
    await this.apiService.resolvePendingTransactions();
  }

  @Get('/status')
  async getStatus() {
    return await this.nodeHealthService.getStatus();
  }

  @Get(`/status/detail`)
  async getDetail(@Query("group") group: string, @Query("start") startTimeStamp: string, @Query("end") endTimeStamp: string) {
    let details = await this.nodeHealthService.getDetail(group, startTimeStamp, endTimeStamp);
    const groupedData = details.reduce((acc, item) => {
      const endpoint = item.endpoint_url;
      if (!acc[endpoint]) {
        acc[endpoint] = [];
      }
      acc[endpoint].push(item);
      return acc;
    }, {});
    return groupedData;
  }

  @Get(`/status/lost`)
  async getLost(@Query("group") group: string, @Query("start") startTimeStamp: string, @Query("end") endTimeStamp: string) {
    let details = await this.nodeHealthService.getLost(group, startTimeStamp, endTimeStamp);
    const groupedData = details.reduce((acc, item) => {
      const endpoint = item.endpoint_url;
      if (!acc[endpoint]) {
        acc[endpoint] = [];
      }
      acc[endpoint].push(item);
      return acc;
    }, {});
    return await this.apiService.findAllLostMinute(groupedData); // 요청 못한 시간 추출하기.
  }

  @Get(`/status/lost/detail`)
  async getLostDetail(@Query("group") group: string, @Query("start") startTimeStamp: string, @Query("end") endTimeStamp: string) {
    let details = await this.nodeHealthService.getLostDetail(group, startTimeStamp, endTimeStamp);
    const groupedData = details.reduce((acc, item) => {
      const endpoint = item.endpoint_url;
      if (!acc[endpoint]) {
        acc[endpoint] = [];
      }
      acc[endpoint].push(item);
      return acc;
    }, {});
    return await this.apiService.groupingLostRequestDetail(groupedData);
  }

  @Get('/distinct-endpoints')
  async getDistinctEndpoints() {
    let endpoints = await this.nodeHealthService.getDistinctEndpoints();
    let distinguishEndpoints = {};
    const odinURL = endpoints.filter(url => !url.includes('heimdall'));
    const heimdallURL = endpoints.filter(url => url.includes('heimdall'));
    distinguishEndpoints['odin'] = odinURL;
    distinguishEndpoints['heimdall'] = heimdallURL;
    return distinguishEndpoints;
  }
}
