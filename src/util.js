const validUR = /^[\w\d ,.?!=+()-]{1,30}$/;
const validUP = /^[ -~]{1,40}$/;
const roomPrefix = "r:";

module.exports = { validUR, validUP, roomPrefix };