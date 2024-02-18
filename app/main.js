import process from 'process';
import { parser } from './parser.js';
import { getAllPeers } from './find-peers.js';
import bencodeJS from 'bencode';
import { Peer } from './connect-peer.js';
const DOWNLOAD_PATH = "temp/";
import fs from "fs";

async function main() {
    let torrent_file_name;
    const command = process.argv[2] ?? "decode";
    switch (command) {
        case "decode":
            const finalResult = bencodeJS.decode(process.argv[3], 'utf8')
            console.log(JSON.stringify(finalResult));
            break;
        case "info":
            torrent_file_name = process.argv[3];
            const result = parser(torrent_file_name);
            console.log("Tracker URL:", result.announce)
            console.log("Length:", result.length)
            console.log("Info Hash:", result.info_hash)
            console.log("Piece Length:", result.piece_length)
            console.log("Piece Hashes: ")
            for (const hash of result.piece_hashes) {
                console.log(hash);
            }
            break
        case "peers":
            torrent_file_name = process.argv[3];
            const peers = await getAllPeers(torrent_file_name);
            for (const i of peers) {
                const str = i.ip + ":" + i.port
                console.log(str)
            }
            break
        case "handshake":
            /*
            telnet 178.62.82.89 51470
            165.232.33.77 51467
            178.62.85.20 51489
            */
            torrent_file_name = process.argv[3];
            const address = process.argv[4];

            // from the command line
            const [static_ip, static_port] = address.split(":");
            const peer_id = "00112233445566778899";
            // const peer_list = await getAllPeers(torrent_file_name);

            // const { static_ip, static_port } = peer_list[2];
            // await handshake(torrent_file_name,ip,port)
            const info_hash = parser(torrent_file_name, "need");
            const peer_options = {
                ip: static_ip,
                port: static_port,
                info_hash,
                peer_id,
            }
            const static_peer = new Peer(peer_options);
            const rs = await static_peer.connect();
            console.log(rs)
            break

        case "download_piece":
            // ! ./your_bittorrent.sh download_piece -o /tmp/test-piece-0 sample.torrent 0
            const output_path = process.argv[4];
            torrent_file_name = process.argv[5];
            const piece_index = parseInt(process.argv[6]);

            await downloadPiece({ output_path, torrent_file_name, piece_index });
            break;

        case "download":
            const downloaded_file_path = process.argv[4];
            torrent_file_name = process.argv[5];

            // get all the piece hashes;
            const parsed_data = parser(torrent_file_name);
            const total_pieces = parsed_data.piece_hashes.length;
            console.log("TOTAL PIECE : ", total_pieces);
            let finalBuffer = Buffer.alloc(0);
            for (let i = 0; i < total_pieces; i++) {
                const filePath = `${DOWNLOAD_PATH}${i}`;
                const res = await downloadPiece({ output_path: filePath, torrent_file_name, piece_index: i });
                if (!res) {
                    console.error("DOWNLOAD BROKEN");
                    // delete the file and try again 
                    fs.rmSync(filePath);
                    i -= 1
                }
                else {
                    const fileBuffer = fs.readFileSync(filePath);
                    finalBuffer = Buffer.concat([finalBuffer, fileBuffer]);
                }
            }

            console.log("DOWNLOADED PIECES SUCCESSFULLY");

            const outputFile = downloaded_file_path;
            console.log(finalBuffer);

            fs.writeFileSync(outputFile, finalBuffer);

            console.log("FILE WRITE SUCCESS");

            break;
        default:
            throw new Error(`Unknown command ${command}`);
    }
}

async function downloadPiece(data) {

    const { output_path, torrent_file_name, piece_index } = data
    const peers_list = (await getAllPeers(torrent_file_name))
    const parsed_data = parser(torrent_file_name);

    // connect with any peer
    const { ip, port } = peers_list[0]

    const total_length = parsed_data.length;
    const piece_length = parsed_data.piece_length;

    const last_piece = Math.floor(total_length / piece_length); // since 0 indexed
    const last_piece_length = total_length % piece_length;

    const infoHash = parser(torrent_file_name, "need")

    const torrentPeer = new Peer({
        ip,
        port,
        piece_length: piece_index === last_piece ? last_piece_length : piece_length,
        piece_index,
        piece_hashes: parsed_data.piece_hashes,
        info_hash: infoHash,
        peer_id: new Uint8Array(20).map((x) => Math.round(Math.random() * 256)),
        output_path
    })
    const res = await torrentPeer.connect();
    return res
}

main();