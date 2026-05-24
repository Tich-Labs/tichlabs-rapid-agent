FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
ENV MCP_TRANSPORT=http
CMD ["node", "dist/index.js"]
