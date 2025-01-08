# 9c-monitor


**https://snxn2iiokwfhaj7rwmrbtd6kt40siufc.lambda-url.ap-northeast-2.on.aws/** (교체 예정)

![image](https://github.com/user-attachments/assets/fde71ffb-decf-49d8-97d7-74686c6592d9)

## Installation

```bash
$ npm install
```

## Running the app

```bash
# watch mode
$ npm run start:dev
```

유의사항
```
// 로컬환경
// api.service.ts 파일의 contstructor에 붙여넣기
this.accounts = [
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_0'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_0'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_1'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_1'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_2'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_2'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_3'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_3'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_4'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_4'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_5'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_5'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_6'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_6'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_7'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_7'),
    },
    {
        privateKey: this.configService.get<string>('PRIVATE_KEY_8'),
        address: this.configService.get<string>('ACCOUNT_ADDRESS_8'),
    }
];

// api.module.ts에 디비 환경변수값으로 사용하기

TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'ninechronicle-monitor.cfwwueuwspfo.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    username: 'xxx',
    password: 'xxx',
    database: 'node_health',
    entities: [NodeHealth],
    synchronize: true,
}),
```
```
// 프로덕선 환경 (배포시)
// api.service.ts 파일의 contstructor에 붙여넣기
const addresses = process.env.addresses.split(',');
const privatekeys = process.env.privatekeys.split(',');
this.accounts = [
    {
        privateKey: privatekeys[0],
        address: addresses[0],
    },
    {
        privateKey: privatekeys[1],
        address: addresses[1],
    },
    {
        privateKey: privatekeys[2],
        address: addresses[2],
    },
    {
        privateKey: privatekeys[3],
        address: addresses[3],
    },
    {
        privateKey: privatekeys[4],
        address: addresses[4],
    },
    {
        privateKey: privatekeys[5],
        address: addresses[5],
    },
    {
        privateKey: privatekeys[6],
        address: addresses[6],
    },
    {
        privateKey: privatekeys[7],
        address: addresses[7],
    },
    {
        privateKey: privatekeys[8],
        address: addresses[8],
    },
];

// api.module.ts에 디비 환경변수값으로 사용하기 (배포를 위해)
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
```


## Deployment
```
$ export AWS_PROFILE=gamefi-dev-poweruser
$ aws configure

$ rm -rf ~/.aws/cli/cache
$ aws sts get-caller-identity
로 assumeRole 되었는지 확인
되었다면

$ cd ~/.aws/cli/cache
$ FILE_NAME=$(grep -rl 'AccessKeyId' .)
$ export AWS_ACCESS_KEY_ID=$(jq -r '.Credentials.AccessKeyId' < "$FILE_NAME") 
$ export AWS_SECRET_ACCESS_KEY=$(jq -r '.Credentials.SecretAccessKey' < "$FILE_NAME") 
$ export AWS_SESSION_TOKEN=$(jq -r '.Credentials.SessionToken' < "$FILE_NAME")
$ unset AWS_PROFILE
$ cd ~/9c-monitor
$ serverless deploy  (serverless login이 되어있다고 가정)
```

## Stack
- Backend: Nest.js, AWS Lambda (Serverless)
- Frontend: HTML, CSS, JS

## Etc
기여 사항 및 성과
- Serverless 아키텍처로 비용 절감: Nest.js를 활용해 서버리스(Serverless) 아키텍처로 AWS Lambda에 배포하여 서비스 유지 비용을 효과적으로 절감.
- ... 기재 예정
- https://in-seo.tistory.com/entry/실-서비스를-Nestjs-Serverless-Lambda로-배포해보자
- https://in-seo.tistory.com/entry/Serverless-배포시에-MFA인증-하기