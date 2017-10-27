
import {SEToken} from "./se.token";
import * as passport from 'passport';
import {Strategy, ExtractJwt} from "passport-jwt";
import {Router} from "express";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";

export class JwtAuth {
	private seToken: SEToken;
	private userHandler: UserHandler;

	constructor(router: Router, userHandler: UserHandler) {
		this.seToken = new SEToken();
		this.userHandler = userHandler;


		passport.use(new Strategy(this.getOptions(), (jwtPayload: any, done: any) => {
			done(null, {jwtPayload: jwtPayload});
		}));

		router.get('/test', passport.authenticate('jwt'), (req: any, res: any) => {
			this.seToken.validatePayload(req.user.jwtPayload, {permissions: ['customer','admin']}).then(
				(payload: any) => {
					res.send('hello, ' + payload.username);
				},
				(error: any) => {
					res.send('you are not welcome here, reason: ' + error);
				});
		});
	}

	public getAutorizationToken(provider: string, providerId: string, name: string, email: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.userHandler.getOrCreateUser(provider, providerId, name, email).then(
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
					reject('getAutorizationToken(): error when getOrCreateUser, reson: ' + error);
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