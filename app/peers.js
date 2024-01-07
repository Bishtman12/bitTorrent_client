
// import axios from 'axios';
import { returnParsedDataToPeer } from './parser.js';
import http from 'http';
import bencodeJS from 'bencode'

function getAllPeers(data) {

    const { tracker_url, pieces, piece_length } = returnParsedDataToPeer(data);
    const params = {
        "tracker_url": tracker_url,
        "info_hash": (pieces),
        "peer_id": Math.floor(Math.random() * (1e19 - 1e18 + 1) + 1e19),
        "port": 6881,
        "uploaded": 0,
        "downloaded": 0,
        "left": piece_length,
        "compact": 1
    }
    const result = makeGetRequest(params);
    return result
}


async function makeGetRequest(data) {
    try {
        const {
            tracker_url, info_hash, peer_id, port, uploaded, downloaded, left, compact
        } = data
        const url = `${tracker_url}?info_hash=${info_hash}&peer_id=${peer_id}&port=${port}&uploaded=${uploaded}&downloaded=${downloaded}&left=${left}&compact=${compact}`;

        http.get(url, (res) => {
            let data = [];
            // Un fragmento de datos ha sido recibido.
            res.on("data", (chunk) => {
                data.push(chunk);
            });
            // Toda la respuesta ha sido recibida.
            res.on("end", () => {
                const dataBuffer = Buffer.concat(data);
                const decodedData = bencodeJS.decode(dataBuffer);
                const peers = decodedData?.peers;
                let ip = "";
                let count = 0;
                let previous_hex = [];
                for (const element of peers) {
                    if (count == 4) {
                        if (previous_hex.length) {
                            previous_hex.push(element)
                            // calculate the hex encoding and add to IP and reset everything
                            const byteArray = Buffer.from(previous_hex); // Example byte array
                            const byteOrder = 'BE'; // 'BE' for big-endian, 'LE' for little-endian
                            const port = byteArray.readUIntBE(0, byteArray.length, byteOrder);
                            ip += port
                            console.log(ip);
                            ip = "";
                            previous_hex = [];
                            count = 0
                        }
                        else {
                            previous_hex.push(element)
                        }
                    }
                    else {
                        ip += element + (count === 3 ? ":" : ".")
                        count += 1
                    }
                }

            });
        });
        return true
    } catch (error) {
        console.error(`Error making GET request to : ${error}`);
    }
}



export { getAllPeers }



