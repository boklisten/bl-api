import { AccessTokenAuth } from "./token/access-token/access-token.auth";

import { GoogleAuth } from "./google/google.auth";
import { FacebookAuth } from "./facebook/facebook.auth";
import { Router } from "express";
import { UserHandler } from "./user/user.handler";
import { LocalAuth } from "./local/local.auth";
import { LocalLoginValidator } from "./local/local-login.validator";
import { LocalLoginHandler } from "./local/local-login.handler";
import { LocalLoginPasswordValidator } from "./local/password/local-login-password.validator";
import { SeCrypto } from "../crypto/se.crypto";
import { HashedPasswordGenerator } from "./local/password/hashed-password-generator";
import { SaltGenerator } from "./local/salt/salt-generator";
import { LocalLoginCreator } from "./local/local-login-creator/local-login-creator";
import { ProviderIdGenerator } from "./local/provider-id/provider-id-generator";
import { SEResponseHandler } from "../response/se.response.handler";
import { TokenEndpoint } from "./token/token.endpoint";
import { TokenHandler } from "./token/token.handler";
import { TokenConfig } from "./token/token.config";
import { FeideAuth } from "./feide/feide.auth";

export class BlAuth {
  private jwtAuth: AccessTokenAuth;
  private googleAuth: GoogleAuth;
  private facebookAuth: FacebookAuth;
  private localAuth: LocalAuth;
  private tokenEndpoint: TokenEndpoint;
  private feideAuth: FeideAuth;

  constructor(router: Router) {
    const userHandler = new UserHandler();

    const localLoginPasswordValidator = new LocalLoginPasswordValidator(
      new SeCrypto()
    );

    const localLoginHandler = new LocalLoginHandler();
    const seCrypto = new SeCrypto();
    const saltGenerator = new SaltGenerator();
    const hashedPasswordGenerator = new HashedPasswordGenerator(
      saltGenerator,
      seCrypto
    );
    const providerIdGenerator = new ProviderIdGenerator(seCrypto);
    const localLoginCreator = new LocalLoginCreator(
      hashedPasswordGenerator,
      providerIdGenerator
    );
    const localLoginValidator = new LocalLoginValidator(
      localLoginHandler,
      localLoginPasswordValidator,
      localLoginCreator,
      userHandler
    );
    const resHandler = new SEResponseHandler();

    const tokenHandler = new TokenHandler(userHandler);

    this.jwtAuth = new AccessTokenAuth(userHandler);

    this.googleAuth = new GoogleAuth(router, resHandler);
    this.facebookAuth = new FacebookAuth(router, resHandler);
    this.localAuth = new LocalAuth(
      router,
      resHandler,
      localLoginValidator,
      tokenHandler
    );
    this.tokenEndpoint = new TokenEndpoint(router, resHandler, tokenHandler);
    this.feideAuth = new FeideAuth(router, resHandler);
  }
}
