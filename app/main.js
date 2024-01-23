import process from 'process';
import { parser } from './parser.js';
import { getAllPeers } from './peers.js';
import bencodeJS from 'bencode';
import { handshake } from './handshake.js';

function main() {

    const command = process.argv[2] ?? "decode";
    const data = process.argv[3] ?? "null";
    const ip = process.argv[4] ?? "null";

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
        case "handshake":
            const ip_split = ip.split(":");
            handshake(data, ip_split[0], ip_split[1]);
            break
        default:
            throw new Error(`Unknown command ${command}`);
    }

}

main();