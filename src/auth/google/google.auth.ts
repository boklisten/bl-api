
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {JwtAuth} from "../token/jwt.auth";
import {ApiPath} from "../../config/api-path";

export class GoogleAuth {
	private jwtAuth: JwtAuth;
	private apiPath: ApiPath;

	constructor(router: Router, jwtAuth: JwtAuth) {
		this.jwtAuth = jwtAuth;
		this.apiPath = new ApiPath();

		passport.use(new OAuth2Strategy({
				clientID: secrets.boklistentest.google.clientId,
				clientSecret: secrets.boklistentest.google.secret,
				callbackURL: this.apiPath.createPath('auth/google/callback')
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'google';
				let providerId = profile.id;
				let username = '';
				
				for (let profileEmail of profile.emails) {
					console.log('profileEmail', profileEmail);
					if (profileEmail.type === 'account') {
						username = profileEmail.value;
					}
				}
				
				console.log('the username!!', username);

				this.jwtAuth.getAutorizationToken(provider, providerId, username).then(
					(jwtoken: string) => {
						done(null, jwtoken);
					},
					(error: any) => {
						done(new Error('error when trying to get auth token, reason: ' + error));
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google'),
			passport.authenticate('google', {scope: ['profile', 'email'] }));
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google/callback'),
			passport.authenticate('google', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
}
