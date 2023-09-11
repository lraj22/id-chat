require("dotenv").config();
const { roomPrefix } = require("./util");

function init(io, currentUsers) {
  // someone is connecting
  io.of("/admdash").on("connection", function (socket) {
    socket.emit("roomdata",
      Object.values(currentUsers)
        .map(function (value) { return value.slice(roomPrefix.length); })
    );

    // when user disconnects: remove event liseners, leave rooms
    function disconnecting() {
      socket.removeAllListeners();
      socket.leaveAll();
      socket.data.username = "";
    }

    // let the connected user listen for events
    socket.on("disconnecting", disconnecting);
  });
}

module.exports = init;