

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Request, Response, Router} from "express";
import {ApiPath} from "../../config/api-path";
import {AccessTokenAuth} from "../token/access-token/access-token.auth";
import {LocalLoginValidator} from "./local-login.validator";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlapiResponse, BlError} from "bl-model";
import {SEDocument} from "../../db/model/se.document";
import {TokenHandler} from "../token/token.handler";

export class LocalAuth {
	apiPath: ApiPath;
	
	constructor(router: Router, private resHandler: SEResponseHandler, private localLoginValidator: LocalLoginValidator,
				private tokenHandler: TokenHandler) {
		this.apiPath = new ApiPath();
		this.createPassportStrategy(localLoginValidator);
		this.createAuthRegister(router, localLoginValidator);
		this.createAuthLogin(router);
	};
	
	private createPassportStrategy(localLoginValidator: LocalLoginValidator) {
		passport.use(new Strategy((username: string, password: string, done: any) => {
			localLoginValidator.validate(username, password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					this.tokenHandler.createTokens(username).then(
						(tokens: {accessToken: string, refreshToken: string}) => {
							done(null, tokens);
						},
						(createTokensError: BlError) => {
							done(null, false, new BlError('error when trying to create tokens')
								.code(906)
								.add(createTokensError));
						});
				},
				(validateError: BlError) => {
					return done(null, false, new BlError('username or password is incorrect')
							.code(908)
							.add(validateError));
				});
		}));
	}
	
	private createAuthLogin(router: Router) {
		router.post(this.apiPath.createPath('auth/local/login'), (req: any, res: any, next: any) => {
				passport.authenticate('local', (error,
												jwTokens: {accessToken: string, refreshToken: string},
												blError: BlError) => {
					
					if (blError) {
						console.log('there was an unkown error...', blError);
						if (!(blError instanceof BlError)) {
							blError = new BlError('unknown error').code(500);
							return this.resHandler.sendErrorResponse(res, blError);
						}
					}
					
					if (error) {
						return next(error);
					}
					
					if (!jwTokens) {
						return this.resHandler.sendErrorResponse(res, blError);
					}
					
					req.login(jwTokens, (error) => {
						if (error) return next(error);
						return this.resHandler.sendResponse(res, new BlapiResponse([
							new SEDocument('refreshToken', jwTokens.refreshToken),
							new SEDocument('accessToken', jwTokens.accessToken)
						]));
					});
					
				})(req, res, next);
			});
	}
	
	private respondWithTokens(res, tokens: {accessToken: string, refreshToken: string}) {
		return this.resHandler.sendResponse(res, new BlapiResponse([
							new SEDocument('refreshToken', tokens.refreshToken),
							new SEDocument('accessToken', tokens.accessToken)
		]));
	}

	private createAuthRegister(router: Router, localLoginValidator: LocalLoginValidator) {
		router.post(this.apiPath.createPath('auth/local/register'), (req: any, res: any) => {
			localLoginValidator.create(req.body.username, req.body.password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					this.tokenHandler.createTokens(req.body.username).then(
						(tokens: {accessToken: string, refreshToken: string}) => {
							this.respondWithTokens(res, tokens);
						},
						(createTokensError: BlError) => {
							this.resHandler.sendErrorResponse(res, new BlError('could not create tokens')
									.add(createTokensError)
									.code(906));
						});
				},
				(loginValidatorCreateError: BlError) => {
					this.resHandler.sendErrorResponse(res, new BlError('could not create user')
							.add(loginValidatorCreateError)
							.code(907));
				});
			});
	}
}
