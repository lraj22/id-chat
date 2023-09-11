// constants
const { validUR, roomPrefix } = require("./util");
const apiBase = "/api/v0/";

// all API requests reach here, the 'finish'
function finish(code, res, additionalHeaders) {
  let headers = {
    "Content-Type": "text/plain; charset=utf-8",
    ...additionalHeaders
  };
  return [code, JSON.stringify(res), headers];
}

// if a request succeeds (should be the usual)
function succeed(data) {
  var successResponse = {};
  successResponse.success = true;
  successResponse.data = data;
  return finish(200, successResponse);
}

// if a request fails (invalid names, missing params, etc.)
function fail(message) {
  var failResponse = {};
  failResponse.success = false;
  failResponse.data = message;
  return finish(400, failResponse);
}

// should never happen (reached impossible point in code, etc.)
function bug(info) {
  var bugResponse = {};
  bugResponse.success = false;
  bugResponse.data = "THIS IS A BUG, please report the following data to @lraj22 on Glitch. Request URL: " + req.url + " Info: " + (info || "(no info provided)");
  return finish(500, bugResponse);
}

// process req.url and return useful bits
function processPath(url) {
  const apiRequest = url.slice(apiBase.length);
  const reqParts = apiRequest.split("?")[0].split("/");
  const params = new URLSearchParams(apiRequest.split("?")[1] || "");
  return {
    apiReqParts: reqParts,
    apiParams: params,
  };
}

// only public function, handles API requests
function handle(req, io) {
  const { apiReqParts, apiParams } = processPath(req.url);
  const scope = apiReqParts[0];
  const validScopes = ["room"];
  if (!scope)
    return fail("No scope provided");
  if (!validScopes.includes(scope))
    return fail("Invalid scope provided");

  switch (scope) {
    case "room":
      const action = apiReqParts[1];
      const validActions = ["userCount"];
      if (!action)
        return fail("No action supplied to base 'room'");
      if (!validActions.includes(action))
        return fail("Invalid action supplied to base 'room'");

      const roomId = apiParams.get("roomId");
      if (!roomId)
        return fail("No roomId supplied");
      if (!validUR.test(roomId))
        return fail("Invalid roomId supplied");

      switch (apiReqParts[1]) {
        case "userCount":
          const room = io.sockets.adapter.rooms.get(roomPrefix + roomId);
          return succeed(room ? room.size : 0);
      }
      return bug("Impossible point reached 0x0100");
  }
  return bug("Impossible point reached 0x0000");
}

// export the handler and the API base
module.exports = {
  handle: handle,
  apiBase: apiBase,
};