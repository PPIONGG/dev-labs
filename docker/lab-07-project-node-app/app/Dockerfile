FROM node:20-alpine

WORKDIR /app

# Copy package.json ก่อนเพื่อใช้ประโยชน์จาก Docker cache
# ถ้า package.json ไม่เปลี่ยน Docker จะไม่ npm install ใหม่
COPY package*.json .

RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
