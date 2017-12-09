
import {SEToken} from "./se.token";
import * as passport from 'passport';
import {Strategy, ExtractJwt} from "passport-jwt";
import {Router} from "express";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";
import {BlError} from "../../bl-error/bl-error";
import isEmail = require("validator/lib/isEmail");

export class JwtAuth {
	private seToken: SEToken;
	private userHandler: UserHandler;

	constructor(userHandler: UserHandler) {
		this.seToken = new SEToken();
		this.userHandler = userHandler;


		passport.use(new Strategy(this.getOptions(), (jwtPayload: any, done: any) => {
			done(null, {jwtPayload: jwtPayload});
		}));
	}

	public getAutorizationToken(provider: string, providerId: string, username: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!provider || provider.length <= 0) reject(new BlError('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(new BlError('providerId is empty or undefined'));
			if (!username || !isEmail(username) || username.length <= 0) reject(new BlError('username is empty, undefined or not an email'));
			
			this.userHandler.getOrCreateUser(provider, providerId, username).then(
				(user: User) => {
					this.seToken.createToken(user.username, user.permission, user.blid).then(
						(jwtoken: string) => {
							resolve(jwtoken);
						},
						(error:  any) => {
							reject('getAuthorizationToken(): error when creating auth token, reason: ' + error);
						});
				},
				(error: any) => {
					reject('getAutorizationToken(): error when getOrCreateUser, reason: ' + error);
				});
		});
	}

	private getOptions(): any {
		let opts: any = {};
		opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
		opts.secretOrKey = this.seToken.getSecret();
		opts.issuer = this.seToken.getOptions().iss;
		opts.audience = this.seToken.getOptions().aud;

		return opts;

	}
}