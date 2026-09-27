FROM node:20-alpine
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ENV HOST 0.0.0.0
ENV PORT 5173
COPY package*.json ./
RUN npm install --silent
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
