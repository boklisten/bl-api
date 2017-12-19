
import {SEToken} from "./se.token";
import * as passport from 'passport';
import {Strategy, ExtractJwt} from "passport-jwt";
import {Router} from "express";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";
import {BlError} from "../../bl-error/bl-error";
import isEmail = require("validator/lib/isEmail");
import {AccessTokenSecret} from "./access-token/access-token.secret";
import {TokenConfig} from "./token.config";

export class JwtAuth {
	private seToken: SEToken;
	private userHandler: UserHandler;
	private accessTokenSecret: AccessTokenSecret;
	private tokenConfig: TokenConfig;

	constructor(userHandler: UserHandler) {
		this.seToken = new SEToken();
		this.userHandler = userHandler;
		this.accessTokenSecret = new AccessTokenSecret();
		const appTokenConfig = require('../../application-config').APP_CONFIG.token;
		this.tokenConfig = new TokenConfig(appTokenConfig.access, appTokenConfig.refresh);


		passport.use(new Strategy(this.getOptions(), (jwtPayload: any, done: any) => {
			done(null, {jwtPayload: jwtPayload});
		}));
	}

	public getAuthorizationToken(provider: string, providerId: string, username: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('JwtAuth').methodName('getAuthorizationToken');
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty or undefined'));
			if (!username || !isEmail(username) || username.length <= 0) reject(blError.msg('username is empty, undefined or not an email'));
			
			this.userHandler.get(provider, providerId).then(
				(user: User) => {
					this.seToken.createToken(user.username, user.permission, user.blid).then(
						(jwtoken: string) => {
							resolve(jwtoken);
						},
						(error:  BlError) => {
							reject(error.add(blError.msg('could not create token')));
						});
				},
				(error: BlError) => {
					reject(error.add(blError.msg('could not get user')));
				});
		});
	}

	private getOptions(): any {
		let opts: any = {};
		opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
		opts.secretOrKey = this.accessTokenSecret.get();
		opts.issuer = this.tokenConfig.accessToken.iss;
		opts.audience = this.tokenConfig.accessToken.aud;

		return opts;

	}
}