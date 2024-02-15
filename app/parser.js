import fs from 'fs'
import crypto from 'crypto';
import bencodeJS from 'bencode';

function parser(fileName, need_info) {
    const decodedValue = decodeFile(fileName);
    const announce = Buffer.from(decodedValue.announce).toString();
    if (need_info == "need") {
        const infoHash = getInfoHash(decodedValue?.info)
        return infoHash
    }
    const piece_hashes = printPieceHashesinHex(decodedValue?.info?.pieces)

    return { piece_hashes, announce, length: decodedValue?.info?.length, info_hash: getInfoHash(decodedValue?.info, 'hex'), piece_length: decodedValue?.info?.['piece length'] }
}

function returnParsedDataToPeer(fileName) {
    const decodedValue = decodeFile(fileName);
    const announce = Buffer.from(decodedValue.announce).toString();
    const piecesHashedArray = getWholePieceHash(decodedValue?.info)
    const finalObject = {
        tracker_url: announce,
        pieces: piecesHashedArray,
        piece_length: decodedValue?.info?.length
    }
    return finalObject
}

function decodeFile(fileName) {
    const fileString = fs.readFileSync(fileName)
    return bencodeJS.decode(fileString);
}

function getWholePieceHash(info) {
    const encodedForm = bencodeJS.encode(info);
    const sha_hashed = crypto.createHash("sha1").update(encodedForm).digest();
    return urlEncodeBytes(sha_hashed)
}

function printPieceHashesinHex(info) {
    let stack = [];
    const result = []
    for (const element of info) {
        if (stack.length == 20) {
            result.push(encodeBuffer(stack, 'hex'))
            stack = []
        }
        stack.push(element)
    }
    result.push(encodeBuffer(stack, 'hex'))
    return result
}

function encodeBuffer(data, encoding) {
    return Buffer.from(data).toString(encoding);
}

function getInfoHash(data, encoding) {
    const encodedValue = bencodeJS.encode(data);
    const infoHash = crypto.createHash("sha1").update(encodedValue).digest(encoding)
    return infoHash
}

function isUrlSafe(char) {
    return (/[a-zA-Z0-9\-\._~]/.test(char))
}

function urlEncodeBytes(buf) {
    let encoded = '';
    for (const element of buf) {
        const charBuf = Buffer.from('00', 'hex');

        // this converts the byte into character
        charBuf.writeUInt8(element);
        const char = charBuf.toString();

        if (isUrlSafe(char)) {
            encoded += char
        } else {
            encoded += `%${charBuf.toString('hex').toUpperCase()}`;
        }
    }
    return encoded
}

export { parser, returnParsedDataToPeer }