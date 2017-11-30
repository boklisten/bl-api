

import {JwtAuth} from "./token/jwt.auth";
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

export class BlAuth {
	private jwtAuth: JwtAuth;
	private googleAuth: GoogleAuth;
	private facebookAuth: FacebookAuth;
	private localAuth: LocalAuth;

	constructor(router: Router) {
		let userSchema = new SESchema('users', UserSchema);
		
		let userDetailSchema = new SESchema('userDetails', UserDetailSchema);
		let userHandler = new UserHandler(userSchema, userDetailSchema);
		
		let localLoginMongoHandler = new EndpointMongodb(new SESchema('localLogins', LocalLoginSchema));
		let localLoginPasswordValidator = new LocalLoginPasswordValidator(new SeCrypto())
		let localLoginHandler = new LocalLoginHandler(localLoginMongoHandler);
		let localLoginValidator = new LocalLoginValidator(localLoginHandler, localLoginPasswordValidator);

		this.jwtAuth = new JwtAuth(router, userHandler);
		
		this.googleAuth = new GoogleAuth(router, this.jwtAuth);
		this.facebookAuth = new FacebookAuth(router, this.jwtAuth);
		this.localAuth = new LocalAuth(router, this.jwtAuth, localLoginValidator);
	}


}