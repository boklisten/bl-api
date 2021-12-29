// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { UserHandler } from "../../user/user.handler";
import { User } from "../../../collections/user/user";
import { AccessTokenAuth } from "./access-token.auth";
chai.use(chaiAsPromised);

const testUsername = "bill@thesite.com";

// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/no-empty-function
describe("AccessTokenAuth", () => {});
