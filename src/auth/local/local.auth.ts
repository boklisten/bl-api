

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Router} from "express";
import {ApiPath} from "../../config/api-path";
import {JwtAuth} from "../token/jwt.auth";
import {LocalLoginValidator} from "./local-login.validator";

export class LocalAuth {
	apiPath: ApiPath;
	
	constructor(router: Router, private jwtAuth: JwtAuth, private localLoginValidator: LocalLoginValidator) {
		this.apiPath = new ApiPath();
		
		
		this.createPassportStrategy(jwtAuth, localLoginValidator);
		this.createAuthGet(router);
		this.createAuthCallback(router);
	};
	
	private createPassportStrategy(jwtAuth: JwtAuth, localLoginValidator: LocalLoginValidator) {
		passport.use(new Strategy((username: string, password: string, done: any) => {
			localLoginValidator.validateOrCreate(username, password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					jwtAuth.getAutorizationToken(localLoginProvider.provider, localLoginProvider.providerId, username).then(
						(jwToken: string) => {
							done(null, jwToken);
						},
						(error: any) => {
							done(new Error('error when trying to get auth token'));
						});
				},
				(error: any) => {
					return done(new Error('username or password is incorrect'));
				});
		}));
	}

	private createAuthGet(router: Router) {
		router.post(this.apiPath.createPath('auth/local'),
			passport.authenticate('local', {
				failureRedirect: this.apiPath.createPath('login'),
			}),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
	
	private createAuthCallback(router: Router) {
		router.get(this.apiPath.createPath('auth/local/callback'),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
}
