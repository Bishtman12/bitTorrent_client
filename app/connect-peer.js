import fs from "fs";
import net from "net";
import crypto from "crypto";
const PROTOCOL_LENGTH = 19;
const PROTOCOL_STRING = "BitTorrent protocol";
const DEFAULT_BLOCK_SIZE = 2 ** 14;
const STOREAGE = "storeage/"

class Peer {
    constructor({
        ip,
        port,
        piece_length,
        piece_index,
        piece_hashes,
        info_hash,
        peer_id,
        output_path = "",
    }) {
        this.ip = ip;
        this.port = port;
        this.info_hash = info_hash
        this.peer_id = peer_id;
        this.piece_length = piece_length;
        this.piece_index = piece_index;
        this.piece_hashes = piece_hashes;
        this.output_path = output_path;
        this.socket = null;
        this.buffer = Buffer.alloc(0);
    }

    async connect() {
        this.socket = net.connect(this.port, this.ip);
        this.socket.on("data", this.handleData.bind(this));
        this.socket.on("error", this.handleError.bind(this));
        this.socket.on("close", () => { console.log("Connection Closed...") })
        await this.doHandshake();
    }

    async doHandshake() {
        const handshake = Buffer.alloc(68);
        handshake.writeUInt8(PROTOCOL_LENGTH, 0);
        handshake.write(PROTOCOL_STRING, 1);
        handshake.writeUInt32BE(0, 20);
        handshake.writeUInt32BE(0, 24);
        this.info_hash.copy(handshake, 28);
        Buffer.from(this.peer_id).copy(handshake, 48);

        //wrote a message in the connection
        this.socket.write(handshake);

        const response = await this.waitForData();

        // ! Handshake response is received in the same format as the handshake message is sent.
        const protocolLength = response.readUInt8(0);
        const infohashResponse = response.slice(protocolLength + 9, protocolLength + 29);
        const peerIdResponse = response.slice(protocolLength + 29, protocolLength + 49);

        if (infohashResponse.toString("hex") !== this.info_hash.toString("hex")) {
            throw new Error("Infohash mismatch");
        }

        console.log(`Peer ID: ${peerIdResponse.toString("hex")}`);
        this.buffer = Buffer.alloc(0);
        //bitfield is sent in the handshake message only.
        if (response.length > 68) {

            this.socket.emit("data", response.slice(68,))

        }
    }

    async waitForData() {
        return new Promise((resolve) => {
            // Define the callback function to handle the "data" event
            const onData = (data) => {
                // Remove the listener to ensure it's only executed once
                this.socket.removeListener("data", onData);
                // Resolve the Promise with the received data
                resolve(data);
            };

            // Attach the onData callback to the "data" event
            this.socket.on("data", onData);
        });
    }

    handleData(data) {

        const res = JSON.stringify(data);
        fs.appendFileSync(`${STOREAGE}PACKETS.txt`, res + "\n******** RECEIVED *********\n");

        this.buffer = Buffer.concat([this.buffer, data]);

        while (this.buffer.length > 4) {
            const messageLength = this.buffer.readUInt32BE(0);
            if (this.buffer.length >= messageLength + 4) {
                const id = this.buffer.readUInt8(4);
                this.handleRequest(id, messageLength);
                this.buffer = this.buffer.slice(messageLength + 4); // Corrected to slice the buffer correctly
            } else {
                break;
            }
        }
    }

    handleRequest(id, length) {
        // Handling different message IDs
        let message;
        switch (id) {
            case 5: // bitfield
                message = Buffer.alloc(5);
                message.writeUInt32BE(1, 0);
                message.writeUInt8(2, 4); // interested message 
                this.sendMessage(message);
                break;
            case 1: // unchoke
                message = Buffer.alloc(17);
                message.writeUInt32BE(13, 0);
                message.writeUInt8(6, 4); // request message 
                message.writeUInt32BE(this.piece_index, 5); // piece index 
                message.writeUInt32BE(0, 9); // begin 
                message.writeUInt32BE(16384, 13); // length of the block in bytes it is fix --> 2^14 (except last block)
                this.sendMessage(message);
                break;
            case 7: // piece
                const incoming_piece_length = this.buffer.readUInt32BE(0);
                const incoming_piece_index = this.buffer.readUInt32BE(5);
                const incoming_block_offset = this.buffer.readUInt32BE(9);
                const incoming_data = this.buffer.subarray(13);
                // have to remember to clear this out
                fs.appendFileSync(this.output_path, incoming_data);
                console.log(
                    `Downloaded block ${incoming_block_offset} of piece ${incoming_piece_index} with length ${incoming_piece_length}.`
                );
                const blockOffset = incoming_block_offset + DEFAULT_BLOCK_SIZE;
                const remainingBytesInPiece = this.piece_length - blockOffset;
                let blockLength;
                if (remainingBytesInPiece < this.standardBlockSize) {
                    // This is the last block of the piece and it is smaller than standard block size
                    blockLength = remainingBytesInPiece;
                } else {
                    blockLength = DEFAULT_BLOCK_SIZE;
                }
                console.log(
                    `after ${incoming_block_offset} we still have ${remainingBytesInPiece} bytes left in the piece`
                );
                if (remainingBytesInPiece > 0) {
                    const message = Buffer.alloc(17);
                    message.writeUInt32BE(13, 0); // length - 9
                    message.writeUInt8(6, 4); // id - 6
                    message.writeUInt32BE(this.piece_index, 5); // piece index
                    message.writeUInt32BE(blockOffset, 9); // block-offset
                    message.writeUInt32BE(blockLength, 13);
                    this.sendMessage(message);
                } else {
                    this.processCompletion();
                }
                break;
            default:
                console.log(`Unhandled message ID: ${id}`);
        }
    }
    processCompletion() {
        const fileBuffer = fs.readFileSync(this.output_path);
        const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
        if (hash !== this.piece_hashes[this.piece_index]) {
            console.error("Hash mismatch. Download corrupted.");
        } else {
            console.log("Download successful and hash verified.");
        }
        this.disconnect();
    }

    handleError(error) {
        console.error("Error:", error);
    }

    sendMessage(message) {
        fs.appendFileSync('data.txt', JSON.stringify(message) + "\n******** SENT *********\n");
        this.socket.write(message);
    }

    disconnect() {
        this.socket.end();
    }
};

export { Peer }
