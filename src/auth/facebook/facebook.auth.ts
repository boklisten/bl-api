

import {Router} from 'express';

import * as passport from "passport";
import {secrets} from "../../config/secrets";
import {Strategy} from 'passport-facebook'
import {UserHandler} from "../user/user.handler";
import {JwtAuth} from "../token/jwt.auth";
import {ApiPath} from "../../config/api-path";
import {BlError} from "../../bl-error/bl-error";

export class FacebookAuth {
	private userHandler: UserHandler;
	private jwtAuth: JwtAuth;
	private apiPath: ApiPath;


	constructor(router: Router, jwtAuth: JwtAuth) {
		this.jwtAuth = jwtAuth;
		this.apiPath = new ApiPath;

		passport.use(new Strategy({
				clientID: secrets.boklistentest.facebook.clientId,
				clientSecret: secrets.boklistentest.facebook.secret,
				callbackURL: this.apiPath.createPath('auth/facebook/callback')

			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'facebook';
				let providerId = profile.id;
				let username = profile.displayName;

				this.jwtAuth.getAuthorizationToken(provider, providerId, username).then(
					(jwtoken: string) => {
						done(null, jwtoken);
					},
					(error: BlError) => {
						done(error.add(new BlError('failed to get auth token for user "' + username + '"')
							.className('FacebookAuth')
							.methodName('strategy').code(400)));
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/facebook'),
			passport.authenticate('facebook', {scope: ['public_profile']}));
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath('auth/facebook/callback'),
			passport.authenticate('facebook', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}

}
