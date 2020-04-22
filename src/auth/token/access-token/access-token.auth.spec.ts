import "mocha";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { UserHandler } from "../../user/user.handler";
import { User } from "../../../collections/user/user";
import { AccessTokenAuth } from "./access-token.auth";
chai.use(chaiAsPromised);

let testUsername = "bill@thesite.com";

describe("AccessTokenAuth", () => {});
