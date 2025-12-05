const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const Redis = require("ioredis");

const redisPublisher = new Redis();
const redisSubscriber = new Redis();

const server = http.createServer((req, res) => {
  const htmlFilePath = path.join(__dirname, "index.html");
  fs.readFile(htmlFilePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error occured while reading file");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", (client) => {
  console.log("successfully connected to the client");

  client.on("message", async (streamMessage) => {
    console.log("message", streamMessage);
    redisPublisher.publish("chat_messages", streamMessage);
  });
});

redisSubscriber.subscribe("chat_messages", (err, count) => {
  if (err) {
    console.error("Failed to subscribe:", err);
  } else {
    console.log(`Subscribed to ${count} channel(s).`);
  }
});

redisSubscriber.on("message", async (channel, message) => {
  console.log("redis", channel, message);
  console.log('message type', typeof (message))
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && message.includes('sss')) {
      console.log('msg inside condition', typeof(message))
      console.log('msg includes', message.includes('sss'))
      client.send(message);
    }
  });
});


const PORT = process.argv[2] || 3459;
server.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});
