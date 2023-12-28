const fs = require("fs");
const bencodeJS = require("bencodejs");
const crypto = require("crypto");

function parser(fileName) {
    const fileString = fs.readFileSync(fileName, { encoding: "binary" })
    const decodedValue = bencodeJS.decode(fileString,'ascii');
    console.log("Tracker URL:", decodedValue?.announce)
    console.log("Length:", decodedValue?.info?.length)
    console.log("Info Hash:", getInfoHash(decodedValue?.info))
    return true
}


function getInfoHash(data) {
    const encodedValue = bencodeJS.encode(data);

    // if(data != (bencodeJS.decode(encodedValue , 'ascii'))) {
    //     console.log(JSON.stringify(data) == JSON.stringify(bencodeJS.decode(encodedValue)));
    //     // console.log("HASH ARE EQUAL")
    // }


    // console.log("ORIGINAL DATA --> ",JSON.stringify(data));

    // console.log("ENCODED DATA --> " , JSON.stringify(bencodeJS.decode(encodedValue)));

    const infoHash = encryptSha1(encodedValue);
    return infoHash
}

function encryptSha1(value) {
    return crypto.createHash('sha1').update(value).digest('hex');
}


module.exports = parser;