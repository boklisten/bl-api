import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { expect } from "chai";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UserHandler } from "../../user/user.handler";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { User } from "../../../collections/user/user";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { AccessTokenAuth } from "./access-token.auth";
chai.use(chaiAsPromised);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const testUsername = "bill@thesite.com";

// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/no-empty-function
describe("AccessTokenAuth", () => {});
