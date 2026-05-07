# Sử dụng Node.js bản 22 (hỗ trợ chạy TS trực tiếp)
FROM node:22-slim

# Cài đặt các công cụ cần thiết để biên dịch better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Build ứng dụng (Vite + Server)
RUN npm run build

# Mở port 3000 (port mặc định của ứng dụng)
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]
