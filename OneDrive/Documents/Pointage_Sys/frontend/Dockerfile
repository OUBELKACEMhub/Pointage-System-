FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN VITE_API_URL=http://localhost:8000/api npm run build

FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-p", "3000"]
