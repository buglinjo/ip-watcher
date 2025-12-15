FROM node:22-alpine
RUN mkdir -p /app
WORKDIR /app
COPY . /app
RUN npm install && npm cache clean --force
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
CMD ["npm", "start"]