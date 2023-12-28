const process = require("process");
const util = require("util");
const bencodeJS = require("bencode-js");

// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue) {

  const value = bencodeJS.decode(bencodedValue)
  return value

}

function main() {
  const command = process.argv[2];
  if (command === "decode") {
    const bencodedValue = process.argv[3];
    console.log(JSON.stringify(decodeBencode(bencodedValue)));
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
