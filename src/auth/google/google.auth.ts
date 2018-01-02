
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {ApiPath} from "../../config/api-path";
import {BlError} from "../../bl-error/bl-error";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlapiResponse} from "bl-model";
import {SEDocument} from "../../db/model/se.document";
import {TokenHandler} from "../token/token.handler";
import * as blConfig from '../../application-config';

export class GoogleAuth {
	private apiPath: ApiPath;

	constructor(router: Router, private resHandler: SEResponseHandler, private tokenHandler: TokenHandler) {
		this.apiPath = new ApiPath();

		passport.use(new OAuth2Strategy({
				clientID: secrets.boklistentest.google.clientId,
				clientSecret: secrets.boklistentest.google.secret,
				callbackURL: this.apiPath.createPath('auth/google/callback')
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = blConfig.APP_CONFIG.login.google.name;
				let providerId = profile.id;
				let username = '';
				console.log('hello there, wtf');
				
				for (let profileEmail of profile.emails) {
					if (profileEmail.type === 'account') {
						username = profileEmail.value;
					}
				}
				
				if (!username || !providerId) {
					return done(null, false, new BlError('username not found by google')
						.code(902)
						.store('provider', provider)
						.store('providerId', providerId));
				}
				
				console.log('trying to create tokens');
				
				tokenHandler.createTokens(username).then(
					(tokens: {accessToken: string, refreshToken: string}) => {
						console.log('we are logged in!');
						done(null, tokens);
					},
					(createTokenErrors: BlError) => {
						return done(null, false, new BlError('could not create tokens')
							.code(906)
							.add(createTokenErrors));
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get(this.apiPath.createPath('auth/google'), (req, res, next) => {
			console.log('we are here now!');
			passport.authenticate('google', {scope: ['profile', 'email'] }, (error, tokens: {accessToken: string, refreshToken: string}, blError: BlError) => {
				console.log('hello there..');
				if (error) {
					console.log('there was an error...', error);
					return next(error);
				}
				if (!tokens) {
					console.log('no tokens...');
					return this.resHandler.sendErrorResponse(res, blError);
				}
				req.login(tokens, (error) => {
					if (error) {
						console.log('there is an error here..', error);
						return next(error);
					}
					console.log('hello there!!');
					
				})
			})(req, res, next);
		})
	}

	private createCallbackGet(router: Router) {
		router.get(this.apiPath.createPath(this.apiPath.createPath('auth/google/callback')),
			(req: any, res: any) => {
				this.resHandler.sendResponse(res, new BlapiResponse([
					new SEDocument('accessToken', req.user.accessToken),
					new SEDocument('refreshToken', req.user.refreshToken),
				]));
			});
	}
}
