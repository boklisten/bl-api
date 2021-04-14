// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlError } from "@boklisten/bl-model";
import { ApiPath } from "./api-path";
import { APP_CONFIG } from "../application-config";

chai.use(chaiAsPromised);

describe("ApiPath", () => {
  describe("#retrieveRefererPath", () => {
    it("should return null if path does not include our basePath", () => {
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({ referer: "https://www.m.facebook.com" })
      ).to.be.eq(null);
    });

    it("should return null if path does not include our basePath", () => {
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({ refferer: "https://google.com" })
      ).to.be.eq(null);
    });

    it("should return refererPath if url includes our basePath", () => {
      APP_CONFIG.path.local.host = "boklisten";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "https://www.boklisten.no/auth/login",
        })
      ).to.be.eq("https://www.boklisten.no/");
    });

    it("should return refererPath if url includes our basePath", () => {
      APP_CONFIG.path.local.host = "boklisten";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "https://bladmin.boklisten.no/auth/login",
        })
      ).to.be.eq("https://bladmin.boklisten.no/");
    });

    it("should return refererPath if url includes our basePath", () => {
      APP_CONFIG.path.local.host = "boklisten";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "https://api.boklisten.no/auth/login",
        })
      ).to.be.eq("https://api.boklisten.no/");
    });

    it("should return refererPath if url includes our basePath", () => {
      APP_CONFIG.path.local.host = "boklisten";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "http://web.test.boklisten.no/auth/login",
        })
      ).to.be.eq("http://web.test.boklisten.no/");
    });

    it("should return refererPath if url includes our basePath", () => {
      APP_CONFIG.path.local.host = "boklisten";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "http://bladmin.test.boklisten.no/auth/login",
        })
      ).to.be.eq("http://bladmin.test.boklisten.no/");
    });

    it("should return refererPath if url includes our local basePath", () => {
      APP_CONFIG.path.local.host = "localhost";
      const apiPath = new ApiPath();
      return expect(
        apiPath.retrieveRefererPath({
          referer: "http://localhost:4200/auth/login",
        })
      ).to.be.eq("http://localhost:4200/");
    });
  });
});
