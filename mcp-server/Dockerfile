FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
ENV MCP_TRANSPORT=http
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
