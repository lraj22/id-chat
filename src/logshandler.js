// logshandler.js - handles chat logs to prevent abuse/misuse

const fs = require("fs");
const { roomPrefix } = require("./util");

// regular chat log stream
var logs = fs.createWriteStream(__dirname + process.env.RAW_CHATS_FILE, {
  flags: "a",
});
// secret messages stream
var secretLogs = fs.createWriteStream(__dirname + process.env.SECRET_FILE, {
  flags: "a",
});

function logFmt(senderName, time, msg, roomId) {
  var output = [senderName, " @ ", time, ": ", msg, "\n"];
  if (roomId) {
    output.splice(3, 0, " [", roomId.slice(roomPrefix.length), "]");
  }
  return output.join("");
}

module.exports = { logs, secretLogs, logFmt };