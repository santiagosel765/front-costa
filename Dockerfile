# Stage 1: Build de la aplicación Angular
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @angular/cli

COPY . .

RUN ng build --configuration=production

FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/ferre-sas-s-project/browser /usr/share/nginx/html

EXPOSE 8080
