FROM node:18

# Install ffmpeg and additional codecs
RUN apt-get update && \
    apt-get install -y ffmpeg \
    libavcodec-extra \
    libavfilter-extra \
    libavformat-extra \
    libavutil-extra \
    libpostproc-extra \
    libswresample-extra \
    libswscale-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000
CMD ["npm", "start"]
