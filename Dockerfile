FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Expose the application port
EXPOSE 3000

CMD ["node", "dist/app.js"]