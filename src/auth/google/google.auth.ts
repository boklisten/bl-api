
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {AccessTokenAuth} from "../token/access-token/access-token.auth";
import {ApiPath} from "../../config/api-path";
import {BlError} from "../../bl-error/bl-error";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlapiResponse} from "bl-model";
import {SEDocument} from "../../db/model/se.document";

export class GoogleAuth {
	private jwtAuth: AccessTokenAuth;
	private apiPath: ApiPath;
	private resHandler: SEResponseHandler;

	constructor(router: Router, jwtAuth: AccessTokenAuth) {
		this.jwtAuth = jwtAuth;
		this.apiPath = new ApiPath();
		this.resHandler = new SEResponseHandler();

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
					if (profileEmail.type === 'account') {
						username = profileEmail.value;
					}
				}

				this.jwtAuth.getAuthorizationToken(provider, providerId, username).then(
					(jwtoken: string) => {
						done(null, jwtoken);
					},
					(authTokenError: BlError) => {
						done(null, false,
							new BlError('failed to make auth token')
								.className('GoogleAuth')
								.methodName('strategy')
								.add(authTokenError)
								.code(906));
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google'), (req, res, next) => {
			passport.authenticate('google', {scope: ['profile', 'email'] }, (error, jwToken: string, blError: BlError) => {
				if (error) {
					return next(error);
				}
				if (!jwToken) {
					return this.resHandler.sendErrorResponse(res, blError);
				}
				req.login(jwToken, (error) => {
					if (error) return next(error);
					return this.resHandler.sendResponse(res, new BlapiResponse([new SEDocument('jwToken', jwToken)]));
				})
			})(req, res, next);
		})
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google/callback'),
			passport.authenticate('google', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
}
