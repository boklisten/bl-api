

import {AccessTokenAuth} from "./token/access-token/access-token.auth";
import {GoogleAuth} from "./google/google.auth";
import {FacebookAuth} from "./facebook/facebook.auth";
import {Router} from "express";
import {UserHandler} from "./user/user.handler";
import {SESchema} from "../config/schema/se.schema";
import {UserDetailSchema} from "../config/schema/user/user-detail.schema";
import {UserSchema} from "../config/schema/user/user.schema";
import {LocalAuth} from "./local/local.auth";
import {LocalLoginValidator} from "./local/local-login.validator";
import {LocalLoginHandler} from "./local/local-login.handler";
import {EndpointMongodb} from "../endpoint/endpoint.mongodb";
import {LocalLoginSchema} from "../config/schema/login-local/local-login.schema";
import {LocalLoginPasswordValidator} from "./local/password/local-login-password.validator";
import {SeCrypto} from "../crypto/se.crypto";
import {SEDocument} from "../db/model/se.document";
import {HashedPasswordGenerator} from "./local/password/hashed-password-generator";
import {SaltGenerator} from "./local/salt/salt-generator";
import {LocalLoginCreator} from "./local/local-login-creator/local-login-creator";
import {ProviderIdGenerator} from "./local/provider-id/provider-id-generator";
import {SEResponseHandler} from "../response/se.response.handler";
import {TokenEndpoint} from "./token/token.endpoint";
import {TokenHandler} from "./token/token.handler";
import {TokenConfig} from "./token/token.config";

export class BlAuth {
	private jwtAuth: AccessTokenAuth;
	private googleAuth: GoogleAuth;
	private facebookAuth: FacebookAuth;
	private localAuth: LocalAuth;
	private tokenEndpoint: TokenEndpoint;

	constructor(router: Router) {
		let userSchema = new SESchema('users', UserSchema);
		let userDetailSchema = new SESchema('userDetails', UserDetailSchema);
		let userMongoHandler = new EndpointMongodb(userSchema);
		let userDetailMongoHanlder = new EndpointMongodb(userDetailSchema);
		let userHandler = new UserHandler();
		
		let localLoginMongoHandler = new EndpointMongodb(new SESchema('localLogins', LocalLoginSchema));
		let localLoginPasswordValidator = new LocalLoginPasswordValidator(new SeCrypto())
		let localLoginHandler = new LocalLoginHandler(localLoginMongoHandler);
		let seCrypto = new SeCrypto();
		let saltGenerator = new SaltGenerator();
		let hashedPasswordGenerator = new HashedPasswordGenerator(saltGenerator,seCrypto);
		let providerIdGenerator = new ProviderIdGenerator(seCrypto);
		let localLoginCreator = new LocalLoginCreator(hashedPasswordGenerator, providerIdGenerator);
		let localLoginValidator = new LocalLoginValidator(localLoginHandler, localLoginPasswordValidator, localLoginCreator, userHandler);
		let resHandler = new SEResponseHandler();
		let appConfig = require('../application-config').APP_CONFIG;
		
		let tokenConfig = new TokenConfig(appConfig.token.access, appConfig.token.refresh);
		let tokenHandler = new TokenHandler(userHandler,tokenConfig);

		this.jwtAuth = new AccessTokenAuth(userHandler);
		
		this.googleAuth = new GoogleAuth(router, resHandler, tokenHandler, userHandler);
		this.facebookAuth = new FacebookAuth(router, resHandler, tokenHandler, userHandler);
		this.localAuth = new LocalAuth(router, resHandler, localLoginValidator, tokenHandler);
		this.tokenEndpoint = new TokenEndpoint(router, resHandler, tokenHandler);
		
	}


}