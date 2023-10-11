/* eslint-disable @typescript-eslint/no-explicit-any */
import { BlError } from "@boklisten/bl-model";

import { UserPermission } from "../user/user-permission";

export type JwtPayload = {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  permission: UserPermission;
  blid: string;
  username: string;
};

export type ValidCustomJwtPayload = {
  permissions?: string[];
  blid?: string;
  username?: string;
};

export type JwtOptions = {
  exp: number;
  aud: string;
  iss: string;
};

export class SEToken {
  private jwt = require("jsonwebtoken");
  private options: JwtOptions;

  constructor(options?: JwtPayload) {
    if (options) {
      this.options = options;
    } else {
      this.options = {
        exp: 57600, //16 hours
        aud: "boklisten.co",
        iss: "boklisten.co",
      };
    }
  }

  public createToken(
    username: string,
    permission: UserPermission,
    blid: string,
  ): Promise<string> {
    const blError = new BlError("")
      .className("SeToken")
      .methodName("createToken");
    if (username.length <= 0)
      return Promise.reject(
        blError.msg('username "' + username + '" is to short'),
      );
    if (permission.length <= 0)
      return Promise.reject(blError.msg("permission is undefined"));
    if (blid.length <= 0)
      return Promise.reject(blError.msg('blid "' + blid + '" is to short'));

    return new Promise((resolve, reject) => {
      this.jwt.sign(
        this.createJwtPayload(username, permission, blid),
        this.getSecret(),
        (error: any, token: string) => {
          if (error) {
            return reject(
              blError
                .msg("error creating jw token")
                .store("signError", error)
                .code(906),
            );
          }
          resolve(token);
        },
      );
    });
  }

  public validateToken(
    token: string,
    validLoginOptions?: any,
  ): Promise<JwtPayload> {
    const blError = new BlError("")
      .className("SeToken")
      .methodName("validateToken");
    if (token.length <= 0) return Promise.reject(blError.msg("token is empty"));

    return new Promise((resolve, reject) => {
      this.jwt.verify(token, this.getSecret(), (error: any, decoded: any) => {
        if (error) {
          return reject(
            blError
              .msg("error verifying token")
              .store("jwtError", error)
              .code(905),
          );
        }

        this.validatePayload(decoded, validLoginOptions).then(
          (jwtPayload: any) => {
            resolve(jwtPayload);
          },
          (validatePayloadError: BlError) => {
            reject(
              blError
                .msg("could not validate payload")
                .store("decodedPayload", decoded)
                .add(validatePayloadError)
                .code(905),
            );
          },
        );
      });
    });
  }

  public validatePayload(
    jwtPayload: JwtPayload,
    validLoginOptions?: any,
  ): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      if (validLoginOptions) {
        if (!validLoginOptions.restrictedToUserOrAbove) {
          if (
            validLoginOptions.permissions &&
            !this.validatePermissions(
              jwtPayload.permission,
              validLoginOptions.permissions,
            )
          ) {
            return reject(
              new BlError(
                'lacking the given permissions, "' +
                  jwtPayload.permission.toString() +
                  '" does not include all the permissions of "' +
                  validLoginOptions.permissions.toString() +
                  '"',
              )
                .className("SeToken")
                .methodName("validateToken")
                .code(905),
            );
          }
        }
      }

      resolve(jwtPayload);
    });
  }

  public getSecret(): string {
    return "this is the key";
  }

  public getOptions(): JwtOptions {
    return this.options;
  }

  private validatePermissions(
    decodedPermission: UserPermission,
    validPermissions: string[],
  ): boolean {
    if (validPermissions.indexOf(decodedPermission) <= -1) return false;
    return true;
  }

  private createJwtPayload(
    username: string,
    permission: UserPermission,
    blid: string,
  ): JwtPayload {
    return {
      iss: this.options.iss,
      aud: this.options.aud,
      iat: Date.now(),
      exp: Date.now() + this.options.exp,
      permission: permission,
      blid: blid,
      username: username,
    };
  }

  public permissionAbove(
    tokenPermission: UserPermission,
    permissions: UserPermission[],
  ) {
    const lowestPermission = permissions[0];

    if (tokenPermission === lowestPermission) return true;

    if (lowestPermission === "customer") {
      if (tokenPermission === "employee") return true;
      if (tokenPermission === "admin") return true;
    }

    if (lowestPermission === "employee") {
      if (tokenPermission === "admin") return true;
    }

    return false;
  }
}
