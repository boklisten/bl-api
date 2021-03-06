// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { JwtPayload, SEToken } from "./se.token";
import { BlError } from "@boklisten/bl-model";

chai.use(chaiAsPromised);

describe("SeToken", () => {
  describe("createToken()", () => {
    let seToken: SEToken = new SEToken();

    it("should reject BlError when username is empty", () => {
      return seToken
        .createToken("", "admin", "something")
        .should.be.rejectedWith(BlError);
    });

    it("should reject BlError when blid is empty", () => {
      return seToken
        .createToken("hello", "admin", "")
        .should.be.rejectedWith(BlError);
    });
  });

  describe("validateToken()", () => {
    let seToken: SEToken = new SEToken();

    it("should reject with BlError if token is empty", () => {
      return seToken.validateToken("").should.be.rejectedWith(BlError);
    });

    it("should decode so the username is the same as when signed", () => {
      return new Promise((resolve, reject) => {
        seToken.createToken("albert", "admin", "1").then(
          (token: string) => {
            seToken.validateToken(token).then(
              (decodedToken: JwtPayload) => {
                resolve(decodedToken.username);
              },
              (error) => {
                //no need
              }
            );
          },
          (error) => {
            //no need for error handling in a test for resolve
          }
        );
      }).should.eventually.be.equal("albert");
    });

    it("should reject if the token lacks permission", () => {
      return new Promise((resolve, reject) => {
        seToken.createToken("albert", "customer", "1").then(
          (token: string) => {
            seToken
              .validateToken(token, {
                permissions: ["admin"],
              })
              .then(
                (decodedToken: JwtPayload) => {},
                (error: any) => {
                  reject(new Error(error));
                }
              );
          },
          (error: any) => {}
        );
      }).should.be.rejectedWith(Error);
    });
  });
});
