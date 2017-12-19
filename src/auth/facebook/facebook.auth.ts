

import {Router} from 'express';

import * as passport from "passport";
import {secrets} from "../../config/secrets";
import {Strategy} from 'passport-facebook'
import {UserHandler} from "../user/user.handler";
import {AccessTokenAuth} from "../token/access-token/access-token.auth";
import {ApiPath} from "../../config/api-path";
import {BlError} from "../../bl-error/bl-error";
import {TokenHandler} from "../token/token.handler";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlapiResponse} from "bl-model";
import {SEDocument} from "../../db/model/se.document";

export class FacebookAuth {
	private userHandler: UserHandler;
	private apiPath: ApiPath;


	constructor(router: Router, private tokenHandler: TokenHandler, private resHandler: SEResponseHandler) {
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
				
				tokenHandler.createTokens(username).then(
					(tokens: {accessToken: string, refreshToken: string}) => {
						done(null, tokens);
					},
					(createTokenError: BlError) => {
						done(new BlError('could not create tokens')
							.add(createTokenError)
							.store('username', username));
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
				this.resHandler.sendResponse(res, new BlapiResponse([
					new SEDocument('accessToken', req.user.accessToken),
					new SEDocument('refreshToken', req.user.refreshToken)
				]));
			});
	}

}
