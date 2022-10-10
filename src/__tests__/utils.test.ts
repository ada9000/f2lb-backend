import { adaToLace, laceToAda } from "../util/utils";

describe("ada conversions", () => {
  it("ada to lace", () => {
    expect(adaToLace((1).toString())).toBe(1000000);
  });
  it("lace to ada", () => {
    expect(laceToAda((1000000).toString())).toBe(1);
  });
  it("ada to lac decimal", () => {
    expect(adaToLace((1.1).toString())).toBe(1100000);
  });
});
