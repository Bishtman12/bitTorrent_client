import process from 'process';
import { parser } from './parser.js';
import { getAllPeers } from './peers.js';

function main() {

    const command = process.argv[2] ?? "decode"
    const data = process.argv[3] ?? "null"

    switch (command) {
        case "decode":
            const finalResult = bencodeJS.decode(data, 'utf8')
            console.log(JSON.stringify(finalResult));
            break;
        case "info":
            parser(data)
            break
        case "peers":
            getAllPeers(data);
            break
        default:
            throw new Error(`Unknown command ${command}`);
    }

}

main();