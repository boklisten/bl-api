

import {Router} from 'express';

import * as passport from "passport";
import {Strategy} from 'passport-facebook'
import {UserHandler} from "../user/user.handler";
import {ApiPath} from "../../config/api-path";
import {TokenHandler} from "../token/token.handler";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlError} from "@wizardcoder/bl-model";
import {User} from "../../collections/user/user";
import {APP_CONFIG} from "../../application-config";

export class FacebookAuth {
	private apiPath: ApiPath;


	constructor(router: Router, private resHandler: SEResponseHandler, private tokenHandler: TokenHandler, private userHandler: UserHandler) {
		this.apiPath = new ApiPath;
		

		passport.use(new Strategy({
				clientID: process.env.FACEBOOK_CLIENT_ID,
				clientSecret: process.env.FACEBOOK_SECRET,
				callbackURL: process.env.BL_API_URI + this.apiPath.createPath('auth/facebook/callback'),
				profileFields: ['id', 'email', 'name'],
				enableProof: true
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'facebook';
				let providerId = profile.id;
				
				let username = '';
				
				if (profile.emails && profile.emails[0] && profile.emails[0].value) {
					username = profile.emails[0].value;
				}
				
				if (!username) {
					return done(null, null, new BlError('username not found from facebook')
						.code(902)
						.store('provider', provider)
						.store('providerId', providerId));
				}
				
				userHandler.exists(provider, providerId).then(
					(exists: boolean) => {
						this.userHandler.valid(username).then(() => {
							this.createTokens(username, done);
						}).catch((userValidError: BlError) => {
							done(null, null, new BlError('user not valid').code(902).add(userValidError));
						});
					},
					(existsError: BlError) => {
						userHandler.create(username, provider, providerId).then(
							(user: User) => {
								this.createTokens(user.username, done);
							},
							(createError: BlError) => {
								done(null, null, new BlError('could not create user')
									.store('username', username)
									.store('provider', provider)
									.store('providerId', providerId)
									.add(createError));
							});
					});
			}));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	};
	
	private createTokens(username, done) {
		this.tokenHandler.createTokens(username).then(
			(tokens: {accessToken: string, refreshToken: string}) => {
				done(null, tokens);
			},
			(createTokenError: BlError) => {
				done(new BlError('could not create tokens')
					.add(createTokenError)
					.store('username', username));
			});
	}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/facebook'),
			passport.authenticate(APP_CONFIG.login.facebook.name, {scope: ['public_profile', 'email']}));
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath('auth/facebook/callback'),
			passport.authenticate(APP_CONFIG.login.facebook.name, { failureRedirect: process.env.CLIENT_URI + APP_CONFIG.path.client.auth.socialLoginFailure}),
			(req: any, res: any) => {
				const refererPath = (req.headers.referer) ? req.headers.referer + '#/' : null;
				this.resHandler.sendAuthTokens(res, req.user.accessToken, req.user.refreshToken, refererPath);
			});
	}

}
