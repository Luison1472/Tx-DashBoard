module.exports = {
  apps: [
    {
      name: "node-health-monitoring",
      script: "dist/main.js", // NestJS 실행 파일 경로
      instances: 1, // 단일 인스턴스 실행
      autorestart: true, // 에러 발생 시 자동 재시작
      watch: false, // 코드 변경 감지는 비활성화 (배포 환경에서는 필요 없음)
      max_memory_restart: "1G", // 메모리 1GB 초과 시 자동 재시작
      env: {
        NODE_ENV: "production",
        DB_HOST: process.env.DB_HOST, // 환경 변수 로드
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD
      }
    }
  ]
};
