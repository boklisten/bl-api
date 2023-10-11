import { Router } from "express";

import { FacebookAuth } from "./facebook/facebook.auth";
import { GoogleAuth } from "./google/google.auth";
import { LocalLoginCreator } from "./local/local-login-creator/local-login-creator";
import { LocalLoginHandler } from "./local/local-login.handler";
import { LocalLoginValidator } from "./local/local-login.validator";
import { LocalAuth } from "./local/local.auth";
import { HashedPasswordGenerator } from "./local/password/hashed-password-generator";
import { LocalLoginPasswordValidator } from "./local/password/local-login-password.validator";
import { ProviderIdGenerator } from "./local/provider-id/provider-id-generator";
import { SaltGenerator } from "./local/salt/salt-generator";
import { AccessTokenAuth } from "./token/access-token/access-token.auth";
import { TokenEndpoint } from "./token/token.endpoint";
import { TokenHandler } from "./token/token.handler";
import { UserHandler } from "./user/user.handler";
import { SeCrypto } from "../crypto/se.crypto";
import { SEResponseHandler } from "../response/se.response.handler";

export class BlAuth {
  constructor(router: Router) {
    const userHandler = new UserHandler();

    const localLoginPasswordValidator = new LocalLoginPasswordValidator(
      new SeCrypto(),
    );

    const localLoginHandler = new LocalLoginHandler();
    const seCrypto = new SeCrypto();
    const saltGenerator = new SaltGenerator();
    const hashedPasswordGenerator = new HashedPasswordGenerator(
      saltGenerator,
      seCrypto,
    );
    const providerIdGenerator = new ProviderIdGenerator(seCrypto);
    const localLoginCreator = new LocalLoginCreator(
      hashedPasswordGenerator,
      providerIdGenerator,
    );
    const localLoginValidator = new LocalLoginValidator(
      localLoginHandler,
      localLoginPasswordValidator,
      localLoginCreator,
      userHandler,
    );
    const resHandler = new SEResponseHandler();

    const tokenHandler = new TokenHandler(userHandler);

    new AccessTokenAuth(userHandler);

    new GoogleAuth(router, resHandler);
    new FacebookAuth(router, resHandler);
    new LocalAuth(router, resHandler, localLoginValidator, tokenHandler);
    new TokenEndpoint(router, resHandler, tokenHandler);
  }
}
