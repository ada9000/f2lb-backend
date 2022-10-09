const { bech32 } = require("bech32");

export function adaToLace(ada: string) {
  return parseFloat(ada) * 1000000;
}

export function laceToAda(lace: string) {
  return parseFloat(lace) / 1000000.0;
}

export function hexToBech32(hex: string): string | undefined {
  console.log(hex);
  const stakeAddressDecoded = "e1" + hex;
  var bech32address: string | undefined;
  if (hex.indexOf("stake") !== 0) {
    bech32address = bech32.encode(
      "stake",
      bech32.toWords(Uint8Array.from(Buffer.from(stakeAddressDecoded, "hex"))),
      1000
    );
  }
  return bech32address;
}
