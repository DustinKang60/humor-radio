FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && apt-get purge -y python3-pip \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY index.js ./

ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "index.js"]
