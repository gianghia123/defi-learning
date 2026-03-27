export function minimizeAddress(address) {
    return address.slice(0, 6) + "..." + address.slice(-4);
}

export function convertToAttoHUST(amountStr, denominator) {
    let amountAttoHust = 0n;
    let intPart = amountStr;
    let fracPart = "";
    if (amountStr.includes('.')) {
        [intPart, fracPart] = amountStr.split('.');
    }
    if (!intPart) intPart = "0";

    let decimalsCount = 0;
    if (denominator === 'HUST') decimalsCount = 18;
    else if (denominator === 'nanoHUST') decimalsCount = 9;
    else if (denominator === 'attoHUST') decimalsCount = 0;

    if (fracPart.length > decimalsCount) {
        fracPart = fracPart.slice(0, decimalsCount);
    } else {
        fracPart = fracPart.padEnd(decimalsCount, '0');
    }

    const fullString = intPart + fracPart;
    amountAttoHust = BigInt(fullString);

    return amountAttoHust;
}