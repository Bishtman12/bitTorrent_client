const process = require("process");
const bencodeJS = require("bencodejs");
const parser = require("./parser");


function main() {

  const command = process.argv[2] ?? "decode"
  if (command === "decode") {
    const bencodedValue = process.argv[3];
    const finalResult = bencodeJS.decode(bencodedValue , 'ascii')
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

