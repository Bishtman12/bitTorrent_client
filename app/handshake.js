import { parser } from './parser.js';
// import { getAllPeers } from './peers.js';
import net from 'net';

async function handshake(data, ip, port) {

    // fetches me the all ips of the peers available 
    // const {ip, port} = (await getAllPeers(data))?.[0];

    //get info hash of the decoded value of info in hex+ sh1 hash format 
    const INFO_HASH = parser(data, "need");

    // default protocol string
    const PROTOCOL_STRING = "BitTorrent protocol";
    // a empty buffer of 8 bytes as 0
    const RESERVED_BYTES = Buffer.alloc(8);
    // const peer id 
    const PEER_ID = "00112233445566778899";
    //! TCP Connection
    const socket = net.createConnection({ port: port, host: ip });

    //reading the data
    socket.on("data", (data) => {
        const pstrlen = data.readUInt8(0);
        const pstr = data.slice(1, 1 + pstrlen).toString();
        const reserved = data.slice(1 + pstrlen, 9 + pstrlen);
        const infoHash = data.slice(9 + pstrlen, 29 + pstrlen);
        const peerId = data.slice(29 + pstrlen, 49 + pstrlen).toString("hex");
        const message = `Peer ID: ${peerId}`;
        console.log(message)
        socket.destroy();
    });

    const message = Buffer.concat([
        Buffer.from([PROTOCOL_STRING.length]),
        Buffer.from(PROTOCOL_STRING),
        RESERVED_BYTES,
        INFO_HASH,
        Buffer.from(PEER_ID),
    ]);
    //making a tcp connection to send the data
    socket.write(message);
}


export { handshake }