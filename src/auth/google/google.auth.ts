

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {ApiPath} from "../../config/api-path";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlError} from "@wizardcoder/bl-model";
import {TokenHandler} from "../token/token.handler";
import * as blConfig from '../../application-config';
import {UserHandler} from "../user/user.handler";
import {User} from "../../collections/user/user";

export class GoogleAuth {
	private apiPath: ApiPath;

	constructor(router: Router, private resHandler: SEResponseHandler, private tokenHandler: TokenHandler, private userHandler: UserHandler) {
		this.apiPath = new ApiPath();

		passport.use(new OAuth2Strategy({
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_SECRET,
				callbackURL: this.apiPath.createPath('auth/google/callback')
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = blConfig.APP_CONFIG.login.google.name;
				let providerId = profile.id;
				let username = '';
				
				for (let profileEmail of profile.emails) {
					if (profileEmail.type === 'account') {
						username = profileEmail.value;
					}
				}
				
				if (!username || username.length <= 0 || !providerId) {
					return done(null, false, new BlError('username not found by google')
						.code(902)
						.store('provider', provider)
						.store('providerId', providerId));
				}
				
				userHandler.exists(provider, providerId).then(
					(exists: boolean) => {
						this.createTokens(username, done);
					},
					(existsError: BlError) => {
						userHandler.create(username, provider, providerId).then(
							(user: User) => {
								this.createTokens(user.username, done);
							},
							(createError: BlError) => {
								createError.printStack();
								done(new BlError('could not create user')
									.store('username', username)
									.store('provider', provider)
									.store('providerId', providerId)
									.add(createError));
							});
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}
	
	private createTokens(username, done) {
		this.tokenHandler.createTokens(username).then(
			(tokens: {accessToken: string, refreshToken: string}) => {
				done(null, tokens);
			},
			(createTokenErrors: BlError) => {
				createTokenErrors.printStack();
				return done(new BlError('could not create tokens')
					.code(906)
					.store('username', username)
					.add(createTokenErrors));
			});
		}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google'),
			passport.authenticate('google', {scope: ['profile', 'email'] }));
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google/callback'),
			passport.authenticate(blConfig.APP_CONFIG.login.google.name, {failureRedirect: this.apiPath.createPath('login') }),
			(req: any, res: any) => {
				this.resHandler.sendAuthTokens(res, req.user.accessToken, req.user.refreshToken);
			});
	}
}
