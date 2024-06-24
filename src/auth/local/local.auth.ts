import { BlapiResponse, BlError } from "@boklisten/bl-model";
import { Router } from "express";
import passport from "passport";
import { Strategy } from "passport-local";

import { LocalLoginValidator } from "./local-login.validator";
import { ApiPath } from "../../config/api-path";
import { SEResponseHandler } from "../../response/se.response.handler";
import { TokenHandler } from "../token/token.handler";

export class LocalAuth {
  apiPath: ApiPath;

  constructor(
    router: Router,
    private resHandler: SEResponseHandler,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private localLoginValidator: LocalLoginValidator,
    private tokenHandler: TokenHandler,
  ) {
    this.apiPath = new ApiPath();
    this.createPassportStrategy(localLoginValidator);
    this.createAuthRegister(router, localLoginValidator);
    this.createAuthLogin(router);
  }

  private createPassportStrategy(localLoginValidator: LocalLoginValidator) {
    passport.use(
      new Strategy((username, password, done) => {
        localLoginValidator.validate(username, password).then(
          () => {
            this.tokenHandler.createTokens(username).then(
              (tokens: { accessToken: string; refreshToken: string }) => {
                done(null, tokens);
              },
              (createTokensError: BlError) => {
                done(
                  null,
                  false,
                  new BlError("error when trying to create tokens")
                    .code(906)
                    .add(createTokensError),
                );
              },
            );
          },
          (validateError: BlError) => {
            if (
              validateError.getCode() === 908 ||
              validateError.getCode() === 901 ||
              validateError.getCode() === 702
            ) {
              return done(
                null,
                false,
                new BlError("username or password is wrong")
                  .code(908)
                  .add(validateError),
              );
            } else {
              return done(
                null,
                false,
                new BlError("could not login").code(900).add(validateError),
              );
            }
          },
        );
      }),
    );
  }

  private createAuthLogin(router: Router) {
    router.post(
      this.apiPath.createPath("auth/local/login"),
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (req: any, res: any, next: any) => {
        passport.authenticate(
          "local",
          (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            error,
            jwTokens: { accessToken: string; refreshToken: string },
            blError: BlError,
          ) => {
            if (blError) {
              if (!(blError instanceof BlError)) {
                blError = new BlError("unknown error").code(500);
                return this.resHandler.sendErrorResponse(res, blError);
              }
            }

            if (error) {
              return next(error);
            }

            if (!jwTokens) {
              return this.resHandler.sendErrorResponse(res, blError);
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            req.login(jwTokens, (error) => {
              if (error) return next(error);
              this.respondWithTokens(res, {
                accessToken: jwTokens.accessToken,
                refreshToken: jwTokens.refreshToken,
              });
            });
          },
        )(req, res, next);
      },
    );
  }

  private respondWithTokens(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    return this.resHandler.sendResponse(
      res,
      new BlapiResponse([
        { documentName: "refreshToken", data: tokens.refreshToken },
        { documentName: "accessToken", data: tokens.accessToken },
      ]),
    );
  }

  private createAuthRegister(
    router: Router,
    localLoginValidator: LocalLoginValidator,
  ) {
    router.post(
      this.apiPath.createPath("auth/local/register"),
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (req: any, res: any) => {
        localLoginValidator.create(req.body.username, req.body.password).then(
          () => {
            this.tokenHandler.createTokens(req.body.username).then(
              (tokens: { accessToken: string; refreshToken: string }) => {
                this.respondWithTokens(res, tokens);
              },
              (createTokensError: BlError) => {
                this.resHandler.sendErrorResponse(
                  res,
                  new BlError("could not create tokens")
                    .add(createTokensError)
                    .code(906),
                );
              },
            );
          },
          (loginValidatorCreateError: BlError) => {
            if (loginValidatorCreateError.getCode() === 903) {
              this.resHandler.sendErrorResponse(res, loginValidatorCreateError);
            } else {
              this.resHandler.sendErrorResponse(
                res,
                new BlError("could not create user")
                  .add(loginValidatorCreateError)
                  .code(907),
              );
            }
          },
        );
      },
    );
  }
}
