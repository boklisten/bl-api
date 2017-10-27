
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {JwtAuth} from "../token/jwt.auth";

export class GoogleAuth {
	private jwtAuth: JwtAuth;

	constructor(router: Router, jwtAuth: JwtAuth) {
		this.jwtAuth = jwtAuth;

		passport.use(new OAuth2Strategy({
				clientID: secrets.boklistentest.google.clientId,
				clientSecret: secrets.boklistentest.google.secret,
				callbackURL: "/api/auth/google/callback"
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'google';
				let providerId = profile.id;
				let name = profile.name.givenName + ' ' + profile.name.familyName;
				let email = profile.email = profile.emails[0].value;

				this.jwtAuth.getAutorizationToken(provider, providerId, name, email).then(
					(jwtoken: string) => {
						done(null, jwtoken);
					},
					(error: any) => {
						done(new Error('error when trying to get auth token, reason: ' + error));
					}
				)


			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get('/api/auth/google',
			passport.authenticate('google', {scope: ['profile', 'email'] }));
	}

	private createCallbackGet(router: Router) {
		router.get('/api/auth/google/callback',
			passport.authenticate('google', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}

}
