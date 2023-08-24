import "mocha";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";
import { UserDetailUpdateHook } from "./user-detail-update.hook";

chai.use(chaiAsPromised);

describe("UserDetailUpdateHook", () => {
  const userDetailUpdateHook = new UserDetailUpdateHook();

  it("should do proper capitalization with latin letters", () => {
    const body = {
      name: "siri matheus berge",
      address: "portalgata 15c",
      postCity: "bartebyen",
    };
    const expected = {
      name: "Siri Matheus Berge",
      address: "Portalgata 15c",
      postCity: "Bartebyen",
    };
    userDetailUpdateHook.before(body);
    assert.deepEqual(body, expected);
  });

  it("should do proper capitalization and spacing with Norwegian letters", () => {
    const body = {
      name: "        TOR åGE       bRingsVær       ",
      address: "øygatÆn     ",
      postCity: "æresGøta   ",
    };
    const expected = {
      name: "Tor Åge Bringsvær",
      address: "Øygatæn",
      postCity: "Æresgøta",
    };
    userDetailUpdateHook.before(body);
    assert.deepEqual(body, expected);
  });

  it("should do proper capitalization on exotic characters", () => {
    const body = {
      name: "İgiorİ ßißßa",
      address: "łFEłŁlo 12ł",
      postCity: "æresGøta   ",
    };
    const expected = {
      name: "İgiori̇ SSißßa",
      address: "Łfełłlo 12ł",
      postCity: "Æresgøta",
    };
    userDetailUpdateHook.before(body);
    assert.deepEqual(body, expected);
  });
});
