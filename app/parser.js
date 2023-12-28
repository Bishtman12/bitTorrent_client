const fs = require("fs");
const bencodeJS = require("bencode-js");
const crypto = require("crypto");

function parser(fileName) {
    const fileString = fs.readFileSync(fileName, { encoding: "binary" })
    const decodedValue = bencodeJS.decode(fileString);
    console.log("Tracker URL:", decodedValue?.announce)
    console.log("Length:", decodedValue?.info?.length)
    console.log("Info Hash:", getInfoHash(decodedValue?.info))
    return true
}


function getInfoHash(data) {
    const encodedValue = bencodeJS.encode(data);
    console.log(data);
    console.log(bencodeJS.decode(encodedValue));
    const infoHash = encryptSha1(encodedValue);
    return infoHash
}

function encryptSha1(value) {
    return crypto.createHash('sha1').update(value).digest('hex');
}


module.exports = parser;