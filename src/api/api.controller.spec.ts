// import { Test, TestingModule } from '@nestjs/testing';
// import { ApiService } from './api.service';
// import { ApiController } from './api.controller';
// import * as dotenv from 'dotenv';
// import { ConfigModule } from '@nestjs/config';
// import { HttpModule } from '@nestjs/axios';
// import { transactionService } from "./db/db.service";
// import { transactionModule } from "./db/db.module";
// import { MutexProviderModule } from "./mutex.provider";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import { db } from "./db/db";
// import { transactionRepository } from "./db/db.repository";
//
// describe('ApiController', () => {
//   let apiController: ApiController;
//   let apiService: ApiService;
//   let txService: transactionService;
//   let txRepository: transactionRepository;
//
//   beforeEach(async () => {
//     dotenv.config();
//
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [
//         TypeOrmModule.forRoot({
//           type: 'mysql',
//           host: 'localhost',
//           port: 3306,
//           username: 'root',
//           password: 'rootroot',
//           database: 'mint',
//           entities: [db],
//           synchronize: true,
//         }),
//         ConfigModule.forRoot({
//           envFilePath: '.development.env',
//         }),
//         HttpModule,
//         transactionModule,
//         MutexProviderModule
//       ],
//       controllers: [ApiController],
//       providers: [
//         {
//           provide: ApiService,
//           useClass: ApiService
//         },
//         {
//           provide: transactionService,
//           useClass: transactionService
//         },
//         {
//           provide: transactionRepository,
//           useClass: transactionRepository
//         },
//       ],
//
//     }).compile();
//
//     apiController = module.get<ApiController>(ApiController);
//     apiService = module.get<ApiService>(ApiService);
//     txService = module.get<transactionService>(transactionService);
//     txRepository = module.get<transactionRepository>(transactionRepository);
//     jest.spyOn(apiController, 'mint');
//   });
//
//   it('should call mint 10 times within 1 second', async () => {
//     const address = '0x5e557C1B54CEe11AFa05B345Ef25590f805ea361';
//
//     const promises = [];
//     for (let i = 0; i < 10; i++) {
//       promises.push(apiController.mint(address));
//     }
//
//     const results = await Promise.all(promises); // 모든 호출이 완료될때까지 기다리는거.
//     console.log(results);
//     expect(apiService.mint).toHaveBeenCalledTimes(10);
//     results.forEach((result) => {
//       expect(result).toBe('minted');
//     });
//   });
// });
