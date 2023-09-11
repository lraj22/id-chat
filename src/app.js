// app.js - the main logic of our chat

require("dotenv").config(); // use .env file
const { io } = require("./server.js"); // servers
// global variables
var currentUsers = {};
// middleware to prevent duplicate/invalid chat users
require("./userchecker")(io, currentUsers);

// handle Socket.IO namespaces
require("./mainchat")(io, currentUsers);
require("./admdash")(io, currentUsers);

// chat system user
const IoClient = require("socket.io-client");
IoClient.io(process.env.HOST_URL, {
  query: {
    name: "system",
    room: "system",
  },
});
