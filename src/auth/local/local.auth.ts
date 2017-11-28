

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Request, Response, Router} from "express";
import {ApiPath} from "../../config/api-path";

export class LocalAuth {
	apiPath: ApiPath;
	
	constructor(router: Router) {
		this.apiPath = new ApiPath();
		
		passport.use(new Strategy((username: string, password: string, done: any) => {
				if (username === 'uname' && password === 'pass') {
					return done(null, {name: 'albert aaberg'});
				}
				return done(null, false, {message: 'Username or password wrong'});
			}));

		this.createAuthEndpoint(router);
	}

	private createAuthEndpoint(router: Router) {
		router.post(this.apiPath.createPath('auth/local'),
			passport.authenticate('local', {
				successRedirect: this.apiPath.createPath('items'),
				failureRedirect: this.apiPath.createPath('login')
			})
		);
	}
}
