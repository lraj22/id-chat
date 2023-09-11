const fs = require("fs");
require("dotenv").config();
const { validUR, roomPrefix } = require("./util");
var { logs, secretLogs, logFmt } = require("./logshandler");

function init(io, currentUsers) {
  // someone is connecting
  io.on("connection", function (socket) {
    var joinedRoomID = roomPrefix + socket.data.roomID;

    // setup
    socket.join(joinedRoomID);
    socket.emit("roomdata",
      Object.values(currentUsers)
        .filter(function (value) { return value.startsWith(joinedRoomID); })
        .map(function (value) { return value.slice(joinedRoomID.length + 1); })
        .filter(function (value) { return value !== socket.data.name; })
    );
  var secret = joinedRoomID === process.env.SECRET_ROOM;
  if (secret) {
    socket.on("getMessages", getMessages);
  }
  socket.on("message", message);
  const characterLimit = secret ? 1000 : 140;

  // when a message arrives
  function message(senderName, msg, callback) {
    senderName = senderName.trim();
    msg = msg.trim();
    if (!validUR.test(senderName)) {
      callback("Please use a valid username.");
      return;
    }
    if (!msg) {
      callback("Please enter a message.");
      return;
    }
    if (msg.length > characterLimit) {
      callback("Your message is too long to send.");
      return;
    }
    var time = new Date().toLocaleString();
    io.to(joinedRoomID).emit(
      "message",
      senderName,
      time,
      msg,
      socket.id
    );
    io.of("/admdash").emit(
      "messageLog",
      socket.data.roomID,
      socket.data.name,
      time,
      msg
    );
    (secret ? secretLogs : logs).write(logFmt(senderName, time, msg, (secret ? undefined : joinedRoomID)));
    callback(false);
  }

  // get all SECRET messages
  function getMessages(callback) {
    if (joinedRoomID === process.env.SECRET_ROOM) {
      fs.readFile(
        __dirname + process.env.SECRET_FILE,
        "utf8",
        function (err, data) {
          if (err) callback(null);
          else callback(data);
        }
      );
    } else {
      callback();
    }
  }

  // when user disconnects: remove event liseners, leave rooms
  function disconnecting() {
    socket.removeAllListeners();
    socket.leaveAll();
    socket.data.name = "";
    socket.data.roomID = "";
    socket.data.username = "null";
  }

  socket.once("disconnecting", disconnecting);
});

io.of("/").adapter.on("join-room", function (room, id) {
  if (!room.startsWith(roomPrefix)) return;
  io.to(room).except(id).emit("joined", currentUsers[id].split("/")[1]);
  io.of("admdash").emit("joinLog", currentUsers[id].slice(roomPrefix.length));
});

io.of("/").adapter.on("leave-room", function (room, id) {
  if (!room.startsWith(roomPrefix)) return;
  io.to(room).emit("left", currentUsers[id].split("/")[1]);
  io.of("admdash").emit("leaveLog", currentUsers[id].slice(roomPrefix.length));
  delete currentUsers[id];
});
}

module.exports = init;