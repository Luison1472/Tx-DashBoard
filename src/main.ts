import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api/api.module';
import { join } from "path";
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

// ✅ 환경 변수 강제 로드
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);

  // ✅ 환경 변수 값 출력 (로그 확인용)
  console.log('🔍 Loaded Environment Variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
  
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.enableCors({
    origin: true,
    credentials: true,
    maxAge: 86400,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'X-Forwarded-Proto',
      'X-Forwarded-For',
      'X-Forwarded-Port'
    ],
    optionsSuccessStatus: 204
  });

  await app.listen(3000);
}
bootstrap();
