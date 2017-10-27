

import {Router} from 'express';

import * as passport from "passport";
import {secrets} from "../../config/secrets";
import {Strategy} from 'passport-facebook'
import {UserHandler} from "../user/user.handler";
import {JwtAuth} from "../token/jwt.auth";

export class FacebookAuth {
	private userHandler: UserHandler;
	private jwtAuth: JwtAuth;


	constructor(router: Router, jwtAuth: JwtAuth) {
		this.jwtAuth = jwtAuth;

		passport.use(new Strategy({
				clientID: secrets.boklistentest.facebook.clientId,
				clientSecret: secrets.boklistentest.facebook.secret,
				callbackURL: "/api/auth/facebook/callback"

			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'facebook';
				let providerId = profile.id;
				let name = profile.displayName;

				this.jwtAuth.getAutorizationToken(provider, providerId, name).then(
					(jwtoken: string) => {
						done(null, jwtoken);
					},
					(error: any) => {
						done(new Error('could not create auth token, reason: ' + error));
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get('/api/auth/facebook',
			passport.authenticate('facebook', {scope: ['public_profile']}));
	}

	private createCallbackGet(router: Router) {
		router.get('/api/auth/facebook/callback',
			passport.authenticate('facebook', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}

}
