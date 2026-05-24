FROM node:22-alpine AS build
ARG VITE_MCP_SERVER_URL
ARG VITE_MCP_API_KEY
ENV VITE_MCP_SERVER_URL=$VITE_MCP_SERVER_URL \
    VITE_MCP_API_KEY=$VITE_MCP_API_KEY
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --base=/

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
