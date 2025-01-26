FROM node:18

WORKDIR /usr/src/app


COPY package*.json ./
RUN npm cache clean --force && npm install


COPY . .


RUN npm rebuild
RUN npm run build

# PM2 설치
RUN npm install pm2 -g

EXPOSE 3000

CMD ["pm2-runtime", "start", "dist/main.js", "--name", "nestjs-app"]
