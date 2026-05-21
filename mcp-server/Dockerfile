FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
ENV MCP_TRANSPORT=http
