FROM node:26
WORKDIR /workspace
COPY dist/ ./dist/
COPY package.json ./
RUN npm install --production
CMD ["node", "dist/index.js"]
