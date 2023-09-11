// common.js - common client-side functions

// id selector
function id(i) { return document.getElementById(i); }

// escape HTML to sanitize it for innerHTML
function escapeHtml(t) { return t.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m]; }); }

// markdown generator
function markdownify(text) {
  return marked.parse(text);
}

var notyf = new Notyf({
  duration: 2000,
  position: {
    x: "right",
    y: "top"
  },
  types: [
    {
      type: "info",
      background: "#10a9ed"
    },
    {
      type: "warning",
      background: "#ed7610",
      duration: 3000
    },
    {
      type: "error",
      background: "#983232",
      duration: 0,
      dismissible: true
    }
  ]
});

// notification function
function popup(msg, type) {
  notyf.open({
    type: type,
    message: msg
  });
}

window.addEventListener("DOMContentLoaded", function () {
  var gotobottom = id("gotobottom");
  if(gotobottom){
    gotobottom.addEventListener("click", function () {
      messages.scrollTo({
        left: 0,
        top: messages.scrollHeight,
        behavior: "smooth"
      });
    });
  }
})

function addMessageElement(lines, scrollToBottom) {
  if (!messages) return;
  var el = messages,
  oldT = el.scrollTop + el.clientHeight,
    oldH = el.scrollHeight;
  var msgEl = document.createElement("li");
  lines.forEach(function (line) {
    var lineDiv = document.createElement("div");
    lineDiv.innerHTML = line;
    msgEl.appendChild(lineDiv);
  });
  messages.appendChild(msgEl);
  if (!showHideSTB) return;
  if ((scrollToBottom === undefined) || (scrollToBottom)) {
    if (oldT + 5 > oldH) el.scrollTo(0, el.scrollHeight);
    showHideSTB();
  }
}