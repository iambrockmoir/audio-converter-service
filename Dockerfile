FROM node:18-slim

# Install FFmpeg with AMR support
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get install -y libopencore-amrnb0 libopencore-amrwb0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Set the command to run the Node.js application
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["index.js"]
