

import {JwtAuth} from "./token/jwt.auth";
import {GoogleAuth} from "./google/google.auth";
import {FacebookAuth} from "./facebook/facebook.auth";
import {Router} from "express";
import {UserHandler} from "./user/user.handler";
import {SESchema} from "../config/schema/se.schema";
import {UserDetailSchema} from "../config/schema/user/user-detail.schema";
import {UserSchema} from "../config/schema/user/user.schema";

export class BlAuth {
	private jwtAuth: JwtAuth;
	private googleAuth: GoogleAuth;
	private facebookAuth: FacebookAuth;

	constructor(router: Router) {
		let userSchema = new SESchema('users', UserSchema);
		let userDetailSchema = new SESchema('userDetails', UserDetailSchema);
		let userHandler = new UserHandler(userSchema, userDetailSchema);

		this.jwtAuth = new JwtAuth(router, userHandler);
		this.googleAuth = new GoogleAuth(router, this.jwtAuth);
		this.facebookAuth = new FacebookAuth(router, this.jwtAuth);
	}


}