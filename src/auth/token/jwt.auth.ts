
import {SEToken} from "./se.token";
import * as passport from 'passport';
import {Strategy, ExtractJwt} from "passport-jwt";
import {Router} from "express";

export class JwtAuth {
	private seToken: SEToken;

	constructor(router: Router) {
		this.seToken = new SEToken();

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

	private getOptions(): any {
		let opts: any = {};
		opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
		opts.secretOrKey = this.seToken.getSecret();
		opts.issuer = this.seToken.getOptions().iss;
		opts.audience = this.seToken.getOptions().aud;

		return opts;

	}




}