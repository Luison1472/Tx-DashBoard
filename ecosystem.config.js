module.exports = {
  apps: [
    {
      name: "nestjs-app",
      script: "dist/main.js",
      instances: "max", // 클러스터 모드
      exec_mode: "cluster", // 여러 CPU 활용
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
