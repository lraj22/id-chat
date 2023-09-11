// userchecker.js - checks incoming users for invalid or duplicate rooms/names

const { validUR, validUP, roomPrefix } = require("./util");
const crypto = require("crypto");

function attach(io, currentUsers) {
  // check chat users' usernames & room names
  io.of("/").use(function (socket, next) {
    function sendBackError(msg) {
      next(new Error(msg));
    }
    const requestedName = socket.handshake.query.name;
    const requestedRoom = socket.handshake.query.room;
    if (requestedName && requestedRoom) {
      let name = requestedName.trim();
      let roomID = requestedRoom.trim();
      var username = roomPrefix + roomID + "/" + name;
      if (!validUR.test(name)) {
        sendBackError("Please enter a valid name");
        return;
      }
      if (!validUR.test(roomID)) {
        sendBackError("Please enter a valid ID");
        return;
      }
      if (Object.values(currentUsers).includes(username)) {
        sendBackError("That username is already in use");
        return;
      }
      currentUsers[socket.id]=username;
      socket.data.name = name;
      socket.data.roomID = roomID;
      socket.data.username = username;
      next();
      return;
    }
    sendBackError("invalid");
  });

  // check admdash connections
  io.of("/admdash").use(function (socket, next) {
    function sendBackError(msg) {
      next(new Error(msg));
    }
    const username = socket.handshake.query.username;
    const password = socket.handshake.query.password;
    if (username && password) {
      if (!validUP.test(username)) {
        sendBackError("Invalid characters in username");
        return;
      }
      if (!validUP.test(password)) {
        sendBackError("Invalid characters in password");
        return;
      }
      if (username !== process.env.ADMDASH_USER) {
        sendBackError("Incorrect credentials");
        return;
      }
      const pwdHash = crypto.createHash("sha256").update(password).digest("hex");
      if (pwdHash !== process.env.ADMDASH_PASS) {
        sendBackError("Incorrect credentials");
        return;
      }
      socket.data.username = username;
      next();
      return;
    }
    sendBackError("invalid");
  });
}

module.exports = attach;