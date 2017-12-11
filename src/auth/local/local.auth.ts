

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Request, Response, Router} from "express";
import {ApiPath} from "../../config/api-path";
import {JwtAuth} from "../token/jwt.auth";
import {LocalLoginValidator} from "./local-login.validator";
import {BlError} from "../../bl-error/bl-error";
import {SEResponseHandler} from "../../response/se.response.handler";
import {BlapiResponse} from "bl-model";
import {SEDocument} from "../../db/model/se.document";

export class LocalAuth {
	apiPath: ApiPath;
	
	constructor(router: Router, private resHandler: SEResponseHandler, private jwtAuth: JwtAuth, private localLoginValidator: LocalLoginValidator) {
		this.apiPath = new ApiPath();
		this.createPassportStrategy(jwtAuth, localLoginValidator);
		this.createAuthRegister(router, localLoginValidator, jwtAuth);
		this.createAuthLogin(router);
	};
	
	private createPassportStrategy(jwtAuth: JwtAuth, localLoginValidator: LocalLoginValidator) {
		let blError = new BlError('').className('LocalAuth').methodName('strategy');
		
		passport.use(new Strategy((username: string, password: string, done: any) => {
			localLoginValidator.validate(username, password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					jwtAuth.getAuthorizationToken(localLoginProvider.provider, localLoginProvider.providerId, username).then(
						(jwToken: string) => {
							done(null, jwToken);
						},
						(error: BlError) => {
							done(null, false, blError
									.msg('error when trying to create auth token')
									.code(906)
									.add(error)
							);
						});
				},
				(validateError: BlError) => {
					blError.msg('username or password is incorrect')
						.code(900)
						.add(validateError);
					
					return done(null, false, blError);
				});
		}));
	}
	
	private createAuthLogin(router: Router) {
		router.post(this.apiPath.createPath('auth/local/login'), (req: any, res: any, next: any) => {
				passport.authenticate('local', (error, jwToken: string, blError: BlError) => {
					if (error) {
						return next(error);
					}
					
					if (!jwToken) {
						return this.resHandler.sendErrorResponse(res, blError);
					}
					
					req.login(jwToken, (error) => {
						if (error) return next(error);
						return this.resHandler.sendResponse(res, new BlapiResponse([new SEDocument('jwToken', jwToken)]));
					});
					
				})(req, res, next);
			});
	}

	private createAuthRegister(router: Router, localLoginValidator: LocalLoginValidator, jwtAuth: JwtAuth) {
		router.post(this.apiPath.createPath('auth/local/register'), (req: any, res: any) => {
			let blError = new BlError('').className('LocalAuth').methodName('authRegister');
			
			localLoginValidator.create(req.body.username, req.body.password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					jwtAuth.getAuthorizationToken(localLoginProvider.provider, localLoginProvider.providerId, req.body.username).then(
						(jwToken: string) => {
							return this.resHandler.sendResponse(res, new BlapiResponse([new SEDocument('jwToken', jwToken)]));
						},
						(authTokenError: BlError) => {
							this.resHandler.sendErrorResponse(res,
								blError
									.msg('could not get auth token')
									.add(authTokenError)
									.code(906));
						});
				},
				(loginValidatorCreateError: BlError) => {
					this.resHandler.sendErrorResponse(res,
						blError
							.msg('could not create user')
							.add(loginValidatorCreateError)
							.code(907));
				});
			});
	}
}
