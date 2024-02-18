// Deprecated
function decodeBencode(bencodedValue) {

    // ! 5:hello
    if (!isNaN(bencodedValue[0])) {
        return decodeString(bencodedValue)
    }

    //! i52e or llee
    else if (bencodedValue[bencodedValue.length - 1] === "e") {
        if (bencodedValue[0] == "i") return decodeInteger(bencodedValue)
        if (bencodedValue[0] == "l") return decodeList(bencodedValue)
        if (bencodedValue[0] == "d") return decodeDict(bencodedValue)

    }
    else {
        console.log("ERROR", bencodedValue ?? "NOT")
        // throw new Error(bencodedValue);
    }
}

function decodeString(value) {

    const colonIndex = value.indexOf(":");
    const length = parseInt(value.substr(0, colonIndex));
    return [
        value.substr(colonIndex + 1, length),
        value.substr(colonIndex + 1 + length)
    ]

}


function decodeInteger(value) {

    const lastEIndex = value.indexOf("e");
    return [
        parseInt(value.substr(1, lastEIndex - 1)),
        value.substr(lastEIndex + 1)
    ];
}


function decodeList(value) {

    const list = [];
    let leftOver = value.substr(1);

    while (leftOver[0] != "e") {

        const [tempValue, tempLeftOver] = decodeBencode(leftOver);
        list.push(tempValue)
        leftOver = tempLeftOver

    }
    return [list, leftOver.substr(1)]
}

function decodeDict(value) {

    const dict = {};
    let leftOver = value.substr(1);

    while (leftOver[0] != "e") {
        const [key, tempLeftOver1] = decodeBencode(leftOver);
        const [val, tempLeftOver2] = decodeBencode(tempLeftOver1);

        dict[key] = val
        leftOver = tempLeftOver2

    }
    return [dict, leftOver.substr(1)]

}


function encodeBencode(data) {
    /*
    {
        length: 92063,
        name: 'sample.txt',
        'piece length': 32768,
        pieces: `èvöz*\x88\x86èók\x13g&Ã\x0F¢\x97\x03\x02-n"uæ\x04 vfVsn\x81ÿ\x10µR\x04­\x8D5ð\r\x93z\x02\x13ß\x19\x82¼\x8D\tr'­\x9E\x90\x9AÌ\x17`
    }
    */
    let encodedAnswer = `e`
    for (const element in data) {
        const key = element;
        let value = data[element]
        if (key == "pieces") value = convertBinaryToString(value)
        const encodedKey = encodeString(key);
        let encodedValue = encodeInt(value);
        if (isNaN(value)) {
            encodedValue = encodeString(value)
        }
        encodedAnswer = `${encodedKey}${encodedValue}${encodedAnswer}`
    }

    encodedAnswer = `d${encodedAnswer}`
    return encodedAnswer
}

function encodeString(value) {
    return `${value.length}:${value}`
}
function encodeInt(value) {
    return `i${value}e`
}

function convertBinaryToString(value) {
    return (Buffer.from(value, 'binary').toString('hex'))
}


module.exports = { decodeBencode, encodeBencode }