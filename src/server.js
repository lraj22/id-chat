// server.js - Serve the page and set up

// stuff we require
const fs = require("fs");
const chatApi = require("./api");
require("dotenv").config();

const http = require("http").createServer(function (req, res) {
  // generic responder
  function e(s, t, h) { res.writeHead(s, h); res.end(t); }

  // presets
  const avTag = "v-2023july19.1"; // auto versioning tag

  // send back a file on the server
  function sendBack(filepath, headers) {
    const replaceAvTags = (filepath.split(".").slice(-1)[0] === "html");
    fs.readFile(__dirname + filepath, function (err, data) {
      if (err) e(404);
      else e(200, replaceAvTags ? (data.toString().split("$AUTO_VERSIONING_TAG$").join(avTag)) : data, headers);
    });
  }

  // headers object to calculate headers based on request url
  let headers = {};
  headers["X-Content-Type-Options"] = "nosniff";
  headers["Content-Type"] = "text/plain; charset=utf-8";
  headers["Cache-Control"] = "max-age=31536000, immutable";

  // if the raw chats file is requested
  if (req.url === process.env.RAW_CHATS_SLUG) {
    sendBack(process.env.RAW_CHATS_FILE, headers);
    return;
  }

  if (req.url === process.env.SECRET_SEE_SLUG) {
    sendBack(process.env.SECRET_FILE, headers);
    return;
  }

  // to run a server-side action on demand
  if (req.url === process.env.DEV_ACTION_SLUG) {
    // action here
    e(200, "developer action completed");
    return;
  }

  // api
  if (req.url.startsWith(chatApi.apiBase)) {
    e(...chatApi.handle(req, io));
    return;
  }

  // normalize the path they requested
  let requestedPath = req.url.split("?")[0];
  requestedPath = requestedPath.replace(/v-.*?\//, ""); // remove auto versioning tag
  if ((!requestedPath.split("/").slice(-1)[0].includes(".")) && (!requestedPath.endsWith("/"))) {
    requestedPath += ".html";
  }
  if (requestedPath.endsWith("/")) {
    requestedPath += "index.html";
  }

  // add more headers based on path
  var mimeMap = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    png: "image/png",
    mp3: "audio/mpeg"
  };
  var extension = requestedPath.split(".").slice(-1)[0];
  if (mimeMap[extension]) {
    headers["Content-Type"] = mimeMap[extension];
  }
  if (extension === "html") {
    headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline'; img-src data: 'self'; style-src-elem 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net; font-src fonts.gstatic.com cdn.jsdelivr.net; script-src-elem 'self' cdn.jsdelivr.net";
    headers["Cache-Control"] = "no-cache";
  }

  // various socket.io files
  const socketAdminBase = "/sockets/admin/";
  if (requestedPath.startsWith(socketAdminBase)) {
    sendBack("/../node_modules/@socket.io/admin-ui/ui/dist/" + (requestedPath.slice(socketAdminBase.length) || "index.html"), headers);
    return;
  }
  const socketIoAssetsBase = "/assets/socket.io/";
  if (requestedPath.startsWith(socketIoAssetsBase)) {
    sendBack("/../node_modules/socket.io/client-dist/" + requestedPath.slice(socketIoAssetsBase.length), headers);
    return;
  }

  // send back the file
  sendBack("/static" + requestedPath, headers);
});

// set up socket.io with the admin ui
const SocketIO = require("socket.io");
const AdminUI = require("@socket.io/admin-ui");
const io = new SocketIO.Server(http, {
  serveClient: false,
  connectionStateRecovery: {
    maxDisconnectionDuration: 45 * 1000,
    skipMiddlewares: true,
  },
});
AdminUI.instrument(io, {
  auth: {
    type: "basic",
    username: process.env.SA_USER,
    password: process.env.SA_PASS
  }
});
http.listen(process.env.PORT || 8080);

// export stuff for app.js to use
module.exports = { io };