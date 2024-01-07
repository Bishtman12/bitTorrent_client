import fs from 'fs'
import crypto from 'crypto';
import bencodeJS from 'bencode';


function parser(fileName) {

    const fileString = fs.readFileSync(fileName)
    const decodedValue = bencodeJS.decode(fileString);
    const announce = Buffer.from(decodedValue.announce).toString();
    console.log("Tracker URL:", announce)
    console.log("Length:", decodedValue?.info?.length)
    console.log("Info Hash:", getInfoHash(decodedValue?.info))
    console.log("Piece Length:", decodedValue?.info?.['piece length'])
    console.log("Piece Hashes: ")
    printPieceHashesinHex(decodedValue?.info?.pieces)
    return true
}


function returnParsedDataToPeer(fileName) {
    const fileString = fs.readFileSync(fileName)
    const decodedValue = bencodeJS.decode(fileString);
    const announce = Buffer.from(decodedValue.announce).toString();
    const piecesHashedArray = printPieceHashesinUrlEncoded(decodedValue?.info)
    const finalObject = {
        tracker_url: announce,
        pieces: piecesHashedArray,
        piece_length: decodedValue?.info?.length
    }
    return finalObject
}

function printPieceHashesinUrlEncoded(info) {
    const encodedForm = bencodeJS.encode(info);
    const sha_hashed = crypto.createHash("sha1").update(encodedForm).digest();
    const infoHashUrlEncoded = urlEncodeBytes(sha_hashed)
    return infoHashUrlEncoded
}

function printPieceHashesinHex(info) {
    let stack = [];
    for (const element of info) {
        //piece hash
        if (stack.length == 20) {
            console.log(`${getPieceHash(stack, 'hex')}`)
            stack = []
        }
        stack.push(element)
    }
    console.log(`${getPieceHash(stack, 'hex')}`)
    return true
}


function getPieceHash(data, encoding) {
    return Buffer.from(data).toString(encoding);
}

function getInfoHash(data) {
    const encodedValue = bencodeJS.encode(data);
    const infoHash = crypto.createHash("sha1").update(encodedValue).digest('hex')
    return infoHash
}

function isUrlSafe(char) {
    return (/[a-zA-Z0-9\-\._~]/.test(char))
}

function urlEncodeBytes(buf) {
    let encoded = ''
    for (let i = 0; i < buf.length; i++) {
        const charBuf = Buffer.from('00', 'hex')
        charBuf.writeUInt8(buf[i])
        const char = charBuf.toString()
        if (isUrlSafe(char)) {
            encoded += char
        } else {
            encoded += `%${charBuf.toString('hex').toUpperCase()}`
        }
    }
    return encoded
}

export { parser, returnParsedDataToPeer }