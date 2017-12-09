

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Request, Response, Router} from "express";
import {ApiPath} from "../../config/api-path";
import {JwtAuth} from "../token/jwt.auth";
import {LocalLoginValidator} from "./local-login.validator";
import {BlError} from "../../bl-error/bl-error";

export class LocalAuth {
	apiPath: ApiPath;
	
	constructor(router: Router, private jwtAuth: JwtAuth, private localLoginValidator: LocalLoginValidator) {
		this.apiPath = new ApiPath();
		
		
		this.createPassportStrategy(jwtAuth, localLoginValidator);
		this.createAuthRegister(router, localLoginValidator, jwtAuth);
		this.createAuthLogin(router);
		this.createAuthCallback(router);
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
							done(error.add(blError.msg('error when trying to create auth token').code(400)));
						});
				},
				(error: BlError) => {
					return done(error.add(blError.msg('username or password is incorrect').code(400)));
				});
		}));
	}
	
	private createAuthLogin(router: Router) {
		router.post(this.apiPath.createPath('auth/local/login'),
			passport.authenticate('local', {
				failureRedirect: this.apiPath.createPath('login'),
			}),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}

	private createAuthRegister(router: Router, localLoginValidator: LocalLoginValidator, jwtAuth: JwtAuth) {
		router.post(this.apiPath.createPath('auth/local/register'),
			(req: any, res: any) => {
				localLoginValidator.create(req.body.username, req.body.password).then(
					(localLoginProvider: {provider: string, providerId: string}) => {
						jwtAuth.getAuthorizationToken(localLoginProvider.provider, localLoginProvider.providerId, req.body.username).then(
							(jwToken: string) => {
								res.send(jwToken);
							},
							(error: BlError) => {
								console.log('localAuth', 'a logger must go here');
								res.status(500);
								res.send(error);
								res.end();
							});
					},
					(error: BlError) => {
						console.log('localAuth', 'a logger must go here')
						res.send('username is already registered');
					});
			});
	}
	
	private createAuthCallback(router: Router) {
		router.get(this.apiPath.createPath('auth/local/callback'),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
}
