const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const { ExpressPeerServer } = require("peer");
const crypto = require("crypto");

const server = http.createServer(app);
const port = process.env.PORT || 3000;

const customGenerationFunction = () =>
  crypto
    .randomBytes(15)
    .toString("base64")
    .replace(/\//g, "_")
    .replace(/\+/g, "-");

const peerServer = ExpressPeerServer(server, {
  proxied: true,
  debug: true,
  path: "/peer",
  generateClientId: customGenerationFunction,
});

const receiverPeerIds = new Set();

peerServer.on("connection", (client) => {
  receiverPeerIds.add(client.getId());
});

peerServer.on("disconnect", (client) => {
  receiverPeerIds.delete(client.getId());
});

app.use(peerServer);

app.use("/receive", express.static(path.join(__dirname, "receive")));

app.use(
  "/send/:id",
  (req, res, next) => {
    if (!receiverPeerIds.has(req.params.id)) {
      return res.status(404).send("The link is invalid or expired");
    }
    next();
  },
  express.static(path.join(__dirname, "send"))
);

server.listen(port);
console.log(`Listening on port ${port}`);
