

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
		
		passport.use(new Strategy((username: string, password: string, done: any) => {
			localLoginValidator.validate(username, password).then(
				(localLoginProvider: {provider: string, providerId: string}) => {
					jwtAuth.getAutorizationToken(localLoginProvider.provider, localLoginProvider.providerId, username).then(
						(jwtToken: string) => {
							done(null, jwtToken);
						},
						(error: any) => {
							done(new Error('error when trying to get auth tokken'));
						});
				},
				(error: any) => {
					return done(new Error('username or password is incorrect'));
				});
		}));

		this.createAuthGet(router);
		this.createAuthCallback(router);
	};
	
	

	private createAuthGet(router: Router) {
		router.post(this.apiPath.createPath('auth/local'),
			passport.authenticate('local', {
				failureRedirect: this.apiPath.createPath('login'),
			}),
			(req: any, res: any) => {
				res.send(req.user);
			}
		);
	}
	
	private createAuthCallback(router: Router) {
		router.get(this.apiPath.createPath('auth/local/callback'),
			(req: any, res: any) => {
				res.send(req.user);
			});
	}
}
