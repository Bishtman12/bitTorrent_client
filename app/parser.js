const fs = require("fs");
const bencodeJS = require("bencode-js");


function parser(fileName) {
    const fileString = fs.readFileSync(fileName, { encoding: "binary" })
    const decodedValue = bencodeJS.decode(fileString);
    console.log("Tracker URL:", decodedValue?.announce)
    console.log("Length:", decodedValue?.info?.length)
    return true
}
module.exports = parser;