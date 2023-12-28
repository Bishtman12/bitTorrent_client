import process from 'process';
import bencodeJS from 'bencode';
import fs from 'fs'
import crypto from 'crypto'

function parser(fileName) {
    const fileString = fs.readFileSync(fileName)
    const decodedValue = bencodeJS.decode(fileString);
    const announce = Buffer.from(decodedValue.announce).toString();
    console.log("Tracker URL:", announce)
    console.log("Length:", decodedValue?.info?.length)
    console.log("Info Hash:", getInfoHash(decodedValue?.info))
    return true
}


function getInfoHash(data) {
  const encodedValue = bencodeJS.encode(data);
  const infoHash = crypto.createHash("sha1").update(encodedValue).digest('hex')
  return infoHash
}


function main() {
  const command = process.argv[2] ?? "decode"

  if (command === "decode") {
    const bencodedValue = process.argv[3];
    const finalResult = bencodeJS.decode(bencodedValue, 'utf8')
    console.log(JSON.stringify(finalResult));
  }

  else if (command === "info") {
    const fileName = process.argv[3];
    parser(fileName)
  }
  else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();

