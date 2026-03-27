# Stage 1: Build the static frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g yarn@1.22.22
RUN yarn install --frozen-lockfile || yarn install
RUN NODE_OPTIONS='--max-old-space-size=4096' yarn build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
