// dashboard.js - the dashboard manager script

// elements
var usnm = document.getElementById("usnm"), pswd = document.getElementById("pswd"), authenticate = document.getElementById("authenticate");

// preset items
var allowAuth = 1;
/*
 * localStorage 'env' usually does not exist,
 * but can indicate the dev environment if set manually.
 * This is to prevent regular users from running into unexpected errors.
 */
var ENVIRONMENT = localStorage.getItem("env");
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

// enter submits the form
function enterToSubmit(e) {
  if (e.key === "Enter") {
    authenticate.click();
  }
}
usnm.addEventListener("keydown", enterToSubmit);
pswd.addEventListener("keydown", enterToSubmit);

// enter moves to next input or authenticates
usnm.addEventListener("keydown", function (e) {
  if (e.key === "Enter") pswd.focus();
});
pswd.addEventListener("keydown", function (e) {
  if (e.key === "Enter") authenticate.click();
});

// manage the username in localStorage
usnm.onkeydown =
  usnm.onkeyup =
  usnm.onchange =
  function () {
    localStorage.setItem(this.id, this.value);
  };
usnm.value = (localStorage.getItem("usnm") || "").trim();
function focusLast() {
  if (pswd.value.trim()) authenticate.focus();
  else if (usnm.value.trim()) pswd.focus();
  else usnm.focus();
}
focusLast();

function validRegexError(p, s) {
  if (s.length < 1) {
    return p + " can't be blank";
  } else if (s.length > 40) {
    return p + ": 40 characters max";
  }
  var filtered = s.replace(/[ -~]/g, "");
  if (filtered.length > 0) {
    return "Invalid character in " + p.toLowerCase();
  }
  return "";
}

// user wants to authenticate
function authenticateUser() {
  if (ENVIRONMENT !== "dev") {
    popup("This feature does not work yet.", "warning");
    return;
  }
  if (!allowAuth) return;
  allowAuth = 0;
  authenticate.textContent = "Loading...";
  window.uname = usnm.value.trim();
  var passwd = pswd.value;
  var errors = validRegexError("Username", uname);
  if (errors) {
    allowAuth = 1;
    authenticate.textContent = "Authenticate";
    popup(errors, "warning");
    return;
  }
  errors = validRegexError("Password", passwd);
  if (errors) {
    allowAuth = 1;
    authenticate.textContent = "Authenticate";
    popup(errors, "warning");
    return;
  }
  window.socket = io.connect("/admdash", {
    query: {
      username: uname,
      password: passwd,
    },
  });
  socket.on("connect_error", function (error) {
    allowAuth = 1;
    authenticate.textContent = "Authenticate";
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
    var listOfPeople = [];
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
    document.body.setAttribute("data-in-dashboard", "true");
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
      'Signed in as: <span class="bluetext">' +
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
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") sidebar.classList.add("hidden");
      else if (e.altKey && e.key === "s") sidebar.classList.toggle("hidden");
    });
    socket.on("messageLog", function (roomName, userName, time, msg) {
      var d = new Date(Date.parse(time));
      time = new Date(
        d.setHours(d.getHours() - d.getTimezoneOffset() / 60)
      ).toLocaleString();
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(userName) +
        '</b><span> at ' +
        escapeHtml(time) +
        ' in <b class="nameColor">' +
        escapeHtml(roomName) +
        '</b> sent:</span>',
        markdownify(escapeHtml(msg))
      ]);
      ding.play();
    });
    socket.on("joinLog", function (joinName) {
      var parts = joinName.split("/");
      var roomName = parts[0];
      var joinerName = parts[1];
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(joinerName) +
        '</b> joined <b class="nameColor">' +
        escapeHtml(roomName) +
        '</b> at ' +
        escapeHtml(new Date().toLocaleString())
      ]);
      listOfPeople.push(joinName);
      renderPeopleList();
    });
    socket.on("leaveLog", function (leaveName) {
      var parts = leaveName.split("/");
      var roomName = parts[0];
      var leaverName = parts[1];
      addMessageElement([
        '<b class="nameColor">' +
        escapeHtml(leaverName) +
        '</b> left <b class="nameColor">' +
        escapeHtml(roomName) +
        '</b> at ' +
        escapeHtml(new Date().toLocaleString())
      ]);
      listOfPeople = listOfPeople.filter(function (person) { return person !== leaveName; });
      renderPeopleList();
    });
  });
}

authenticate.addEventListener("click", authenticateUser);

popup("This page is still in development!", "info");