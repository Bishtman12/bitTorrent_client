import process from 'process';
import bencodeJS from 'bencode';
import fs from 'fs'
import crypto from 'crypto'

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


function main() {

  const command = process.argv[2] ?? "decode"
  if (command === "decode") {
    const bencodedValue = process.argv[3];
    const finalResult = bencodeJS.decode(bencodedValue)
    console.log(JSON.stringify(finalResult));
  }

  else if (command === "info") {
    const fileName = process.argv[3];
    parser(fileName)
    return true
  }
  else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();

