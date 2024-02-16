import fs from "fs";
import net from "net";
import crypto from "crypto";

const PROTOCOL_LENGTH = 19;
const PROTOCOL_STRING = "BitTorrent protocol";
const DEFAULT_BLOCK_SIZE = 2 ** 14;
const STORAGE_PATH = "storage/";

class Peer {
    constructor({ ip, port, piece_length, piece_index, piece_hashes, info_hash, peer_id, output_path = "" }) {
        this.ip = ip;
        this.port = port;
        this.info_hash = info_hash;
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
        this.socket.on("close", () => console.log("Connection Closed..."));
        await this.doHandshake();
    }

    async doHandshake() {
        const handshake = Buffer.alloc(68);
        handshake.writeUInt8(PROTOCOL_LENGTH, 0);
        handshake.write(PROTOCOL_STRING, 1);
        handshake.fill(0, 20, 28); // Zero-fill reserved bytes
        this.info_hash.copy(handshake, 28);
        Buffer.from(this.peer_id).copy(handshake, 48);
        this.socket.write(handshake);

        const response = await this.waitForData();
        this.validateHandshake(response);
        this.buffer = Buffer.alloc(0);
        if (response.length > 68) {
            this.socket.emit("data", response.slice(68));
        }
    }

    validateHandshake(response) {
        const protocolLength = response.readUInt8(0);
        const infohashResponse = response.slice(protocolLength + 9, protocolLength + 29);
        const peerIdResponse = response.slice(protocolLength + 29, protocolLength + 49);

        if (infohashResponse.toString("hex") !== this.info_hash.toString("hex")) {
            throw new Error("Infohash mismatch");
        }
        console.log(`Peer ID: ${peerIdResponse.toString("hex")}`);
    }

    async waitForData() {
        return new Promise((resolve) => {
            const onData = (data) => {
                this.socket.removeListener("data", onData);
                resolve(data);
            };
            this.socket.on("data", onData);
        });
    }

    handleData(data) {
        fs.appendFileSync(`${STORAGE_PATH}PACKETS.txt`, JSON.stringify(data) + "\n******** RECEIVED *********\n");
        this.buffer = Buffer.concat([this.buffer, data]);
        this.processBuffer();
    }

    processBuffer() {
        while (this.buffer.length > 4) {
            const messageLength = this.buffer.readUInt32BE(0);
            if (this.buffer.length >= messageLength + 4) {
                const id = this.buffer.readUInt8(4);
                this.handleRequest(id, messageLength);
                this.buffer = this.buffer.slice(messageLength + 4);
            } else {
                break;
            }
        }
    }

    handleRequest(id) {
        switch (id) {
            case 5: // bitfield
                this.sendMessage(this.constructMessage(2, 1));
                break;
            case 1: // unchoke
                this.sendMessage(this.constructRequestMessage());
                break;
            case 7: // piece
                this.handlePiece();
                break;
            default:
                console.log(`Unhandled message ID: ${id}`);
        }
    }

    constructMessage(id, length = 1) {
        const message = Buffer.alloc(length + 4);
        message.writeUInt32BE(length, 0);
        message.writeUInt8(id, 4);
        return message;
    }

    constructRequestMessage(nextBlockOffset = 0,blockSize = DEFAULT_BLOCK_SIZE) {
        const message = this.constructMessage(6, 13);
        message.writeUInt32BE(this.piece_index, 5);
        message.writeUInt32BE(nextBlockOffset, 9); // blockLength
        message.writeUInt32BE(blockSize, 13); // block length
        return message;
    }
x
    handlePiece() {
        const incoming_piece_index = this.buffer.readUInt32BE(5);
        const incoming_block_offset = this.buffer.readUInt32BE(9);
        const incoming_data = this.buffer.subarray(13);
        fs.appendFileSync(this.output_path, incoming_data);
        console.log(`Downloaded block ${incoming_block_offset} of piece ${incoming_piece_index}.`);
        this.requestNextBlockOrComplete(incoming_block_offset);
    }

    requestNextBlockOrComplete(blockOffset) {
        const nextBlockOffset = blockOffset + DEFAULT_BLOCK_SIZE;
        const remainingBytesInPiece = this.piece_length - nextBlockOffset;
        if (remainingBytesInPiece > 0) {
            this.sendMessage(this.constructRequestMessage(nextBlockOffset, Math.min(DEFAULT_BLOCK_SIZE, remainingBytesInPiece)));
        } else {
            this.computeDownloadedFiles();
        }
    }

    computeDownloadedFiles() {
        const fileBuffer = fs.readFileSync(this.output_path);
        const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
        if (hash !== this.piece_hashes[this.piece_index]) {
            console.error("Hash mismatch! Download Broken");
        } else {
            console.log("Downloaded Piece successfully");
        }
        this.disconnect();
    }

    handleError(error) {
        console.error("Error:", error);
    }

    sendMessage(message) {
        fs.appendFileSync(`${STORAGE_PATH}PACKETS.txt`, JSON.stringify(message) + "\n******** SENT *********\n");
        this.socket.write(message);
    }

    disconnect() {
        this.socket.end();
    }
}

export { Peer };
