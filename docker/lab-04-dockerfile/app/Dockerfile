# เลือก base image — ใช้ Alpine เพราะเล็ก
FROM node:20-alpine

# ตั้ง working directory ใน container
WORKDIR /app

# คัดลอก source code เข้าไปใน container
COPY app.js .

# ประกาศพอร์ต (เป็นแค่ documentation)
EXPOSE 3000

# คำสั่งที่รันเมื่อ container เริ่มทำงาน
CMD ["node", "app.js"]
