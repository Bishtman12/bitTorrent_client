
import { returnParsedDataToPeer } from './parser.js';
import bencodeJS from 'bencode'
import axios from 'axios';

async function getAllPeers(data) {
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
    const result = await makeGetRequest(params);
    return result
}

async function makeGetRequest(data) {
    try {
        const {
            tracker_url, info_hash, peer_id, port, uploaded, downloaded, left, compact
        } = data
        const url = `${tracker_url}?info_hash=${info_hash}&peer_id=${peer_id}&port=${port}&uploaded=${uploaded}&downloaded=${downloaded}&left=${left}&compact=${compact}`;

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            responseType: "arraybuffer"
        };
        const resultBuffer = (await axios.request(config))?.data

        if (!resultBuffer) {
            console.log("Can't Find any peers at the moment")
            return false
        }

        const { peers } = bencodeJS.decode(resultBuffer);
        let count = 0;
        let previous_hex = [];
        let ip = ''
        const all_ips = [];
        for (const element of peers) {
            if (count == 4) {
                if (previous_hex.length) {
                    previous_hex.push(element)
                    // calculate the hex encoding and add to IP and reset everything
                    const byteArray = Buffer.from(previous_hex); // Example byte array
                    const byteOrder = 'BE'; // 'BE' for big-endian, 'LE' for little-endian
                    const port = byteArray.readUIntBE(0, byteArray.length, byteOrder);
                    all_ips.push({ ip: ip.slice(0, ip.length - 1), port })
                    ip += port
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

        return all_ips
    }
    catch (error) {
        console.error(`Error making GET request to : ${error}`);
    }
}

export { getAllPeers }





/* 
!Info 
For example, the byte sequence [178, 62, 82, 89, 201, 14, 165, 232, 33, 77, 201, 11]
would correspond to IP:port pairs of
178.62.82.89:51470
165.232.33.77:51467

In our example, 201 = 0xc9 in hexadecimal and 14 = 0x0e in hexadecimal
When put together left to right, 0xc90e is 51470 ((16^0) x 14 + (16^1) x 0 + (16 ^2) x 9 + (16^3) x 12)

*/