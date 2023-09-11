// client.js - the browser script

// predefined things
// elements
var username = id("username"),
  roomid = id("roomid"),
  join = id("join"),
  messages = id("messages"),
  sendForm = id("sendForm"),
  chatInput = id("chatInput"),
  sendButton = id("sendButton"),
  information = id("information"),
  infoCover = id("infoCover"),
  disconnected = id("disconnected"),
  reconnect = id("reconnect"),
  sidebar = id("sidebar"),
  numofpeople = id("numofpeople"),
  peopleList = id("peopleList");
// starter and functions
function showHideSTB() {
  var totalHeight = messages.scrollHeight - messages.clientHeight;
  var position = messages.scrollTop;
  if ((totalHeight - position) > 512) {
    gotobottom.classList.remove("hidden");
  } else {
    gotobottom.classList.add("hidden");
  }
}
messages.addEventListener("scroll", showHideSTB);
// regex for checking valid room and user names
var valid = /^[\w\d ,.?!=+()-]{1,30}$/;
// preset items
var allowJoin = 1;

// check for auto join
var parsedURL = new URL(location.href);
var searchParams = parsedURL.searchParams;
var urlUsername = searchParams.get("name"),
  urlRoom = searchParams.get("room");
if (urlUsername && urlRoom) {
  username.value = urlUsername;
  roomid.value = urlRoom;
  joinRoom();
  history.pushState({}, null, "/");
}

// enter moves to next input or joins
username.addEventListener("keydown", function (e) {
  if (e.key === "Enter") roomid.focus();
});
roomid.addEventListener("keydown", function (e) {
  if (e.key === "Enter") join.click();
});

// manage the user's name/room
username.onkeydown =
  username.onkeyup =
  username.onchange =
  roomid.onkeydown =
  roomid.onkeyup =
  roomid.onchange =
  function () {
    localStorage.setItem(this.id, this.value);
  };
username.value = (localStorage.getItem("username") || "").trim();
roomid.value = (localStorage.getItem("roomid") || "").trim();
function focusLast() {
  if (roomid.value.trim()) join.focus();
  else if (username.value.trim()) roomid.focus();
  else username.focus();
}
focusLast();

function validRegexError(p, s) {
  if (s.length < 1) {
    return p + " can't be blank";
  } else if (s.length > 30) {
    return p + ": 30 characters max";
  }
  var filtered = s.replace(/[\w\d ,.?!=+()-]/g, "");
  if (filtered.length > 0) {
    return "Invalid character " + filtered[0] + " in " + p.toLowerCase();
  }
  return "";
}

// user wants to join a room
function joinRoom() {
  if (!allowJoin) return;
  allowJoin = 0;
  join.textContent = "Joining...";
  window.uname = username.value.trim(),
    window.uid = roomid.value.trim();
  var errors = validRegexError("Name", uname);
  if (errors) {
    allowJoin = 1;
    join.textContent = "Join";
    popup(errors, "warning");
    return;
  }
  errors = validRegexError("Room", uid);
  if (errors) {
    allowJoin = 1;
    join.textContent = "Join";
    popup(errors, "warning");
    return;
  }
  window.socket = io("/", {
    query: {
      name: uname,
      room: uid,
    },
  });
  socket.on("connect_error", function (error) {
    allowJoin = 1;
    join.textContent = "Join";
    popup(escapeHtml(error.message), "warning");
  });
  reconnect.addEventListener("click", function () {
    socket.connect();
  });
  socket.on("disconnect", function () {
    popup("<b>You</b> disconnected! Trying to reconnect...", "error");
    disconnected.classList.remove("hidden");
  });
  socket.on("connect", function () {
    notyf.dismissAll();
    disconnected.classList.add("hidden");
    var listOfPeople = [uname];
    id("roomNameDisplay").textContent = "Room: " + uid;
    function renderPeopleList() {
      numofpeople.textContent = "" + listOfPeople.length;
      listOfPeople.sort();
      peopleList.innerHTML = "";
      listOfPeople.forEach(function (person) {
        var li = document.createElement("li");
        if (person === uname) li.classList.add("bluetext");
        li.textContent = person;
        peopleList.appendChild(li);
      });
    }
    socket.once("roomdata", function (people) {
      listOfPeople.push.apply(listOfPeople, people);
      renderPeopleList();
    });
    document.body.setAttribute("data-in-chat", "true");
    addMessageElement(['You connected at ' + escapeHtml(new Date().toLocaleString())]);
    chatInput.focus();
    var ding = id("ding"),
      dingOK = localStorage.getItem("ding");
    if (dingOK !== null) ding.volume = JSON.parse(dingOK) ? 0.1 : 0;
    else {
      ding.volume = 0.1;
      localStorage.setItem("ding", "true");
    }
    function sendMessage() {
      var value = chatInput.value.trim();
      if (value) {
        chatInput.value = "";
        socket.emit("message", uname, value, function (feedback) {
          if (feedback) {
            popup(feedback, "warning");
          }
        });
      } else popup("Please enter a non-empty message.", "warning");
    }
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
    sendButton.addEventListener("click", function (e) {
      e.preventDefault();
      sendMessage();
    });
    document.getElementById("yourname").innerHTML =
      'Your name is: <span class="bluetext">' +
      escapeHtml(uname) +
      "</span>";
    var togglemute = id("togglemute");
    information.addEventListener("click", function () {
      sidebar.classList.toggle("hidden");
      if (ding.volume) togglemute.textContent = "volume_up";
      else togglemute.textContent = "volume_mute";
    })
    document
      .getElementById("logout")
      .addEventListener("click", function () {
        location.href += "";
      });
    togglemute.addEventListener("click", function () {
      if (ding.volume) {
        ding.volume = 0;
        togglemute.textContent = "volume_mute";
        localStorage.setItem("ding", "false");
        popup("Notification sounds: OFF", "info");
      } else {
        ding.volume = 0.1;
        togglemute.textContent = "volume_up";
        localStorage.setItem("ding", "true");
        popup("Notification sounds: ON", "info");
      }
    });
    var getlink = id("getlink");
    getlink.addEventListener("click", function () {
      var outputURL = new URL(location.href);
      outputURL.searchParams.set("name", uname);
      outputURL.searchParams.set("room", uid);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(outputURL.toString()).then(
          function () {
            popup("Link copied.", "info");
          },
          function () {
            alert("Here's the link: " + outputURL.toString());
          }
        );
      } else {
        alert("Here's the link: " + outputURL.toString());
      }
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") sidebar.classList.add("hidden");
      else if (e.altKey && e.key === "s") sidebar.classList.toggle("hidden");
    });
    socket.on("message", function (playerName, time, msg, senderID) {
      var d = new Date(Date.parse(time));
      time = new Date(
        d.setHours(d.getHours() - d.getTimezoneOffset() / 60)
      ).toLocaleString();
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(playerName) +
        "</b><span> at " +
        escapeHtml(time) +
        " sent:</span>",
        markdownify(escapeHtml(msg))
      ]);
      if (socket.id !== senderID) ding.play();
    });
    socket.on("joined", function (joinName) {
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(joinName) +
        '</b> joined at ' +
        escapeHtml(new Date().toLocaleString())
      ]);
      listOfPeople.push(joinName);
      renderPeopleList();
    });
    socket.on("left", function (leaveName) {
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(leaveName) +
        '</b> left at ' +
        escapeHtml(new Date().toLocaleString())
      ]);
      listOfPeople = listOfPeople.filter(function (person) { return person !== leaveName; });
      renderPeopleList();
    });
    if (!window.msgsText) socket.emit("getMessages", function (msgs) {
      if (msgs === null) {
        popup(
          '<span class="redtext">Failed to load previous messages</span>',
          "error"
        );
      } else if (msgs === undefined) {
        popup('<span class="redtext">Access not allowed.</span>', "error");
      } else if (msgs === "") {
      } else {
        var msgList = msgs.slice(0, -1).split("\n");
        msgList.forEach(function (msg, i) {
          var msgParts = msg.split(": ");
          var metadata = msgParts[0].split(" @ ");
          var sender = metadata[0];
          var utcTime = metadata[1];
          var parsedUtcTime = new Date(Date.parse(utcTime));
          var correctTime = new Date(parsedUtcTime);
          correctTime.setHours(
            correctTime.getHours() - correctTime.getTimezoneOffset() / 60
          );
          var shownTime = correctTime.toLocaleString();
          var message = msgParts.slice(1).join(": ");
          addMessageElement([
            '<b class="nameColor">' +
            escapeHtml(sender) +
            "</b><span> at " +
            escapeHtml(shownTime) +
            " sent:</span>",
            markdownify(escapeHtml(message))
          ]);
          if (i === (msgList.length - 1)) {
            messages.scrollTo({
              top: messages.scrollHeight,
              left: 0,
              behavior: "smooth",
            });
          }
        });
        window.msgsText = msgs;
        window.msgsList = msgList;
      }
    });
  });
}
join.addEventListener("click", joinRoom);
