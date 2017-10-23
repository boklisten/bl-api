

import * as passport from 'passport';
import {Strategy} from 'passport-local';
import {Request, Response, Router} from "express";

export class LocalAuth {

	constructor(router: Router) {
		passport.use(new Strategy((username: string, password: string, done: any) => {
				if (username === 'uname' && password === 'pass') {
					return done(null, {name: 'albert aaberg'});
				}
				return done(null, false, {message: 'Username or password wrong'});
			}));

		this.createAuthEndpoint(router);
	}

	createAuthEndpoint(router: Router) {
		router.post('/api/auth/local',
			passport.authenticate('local', {
				successRedirect: '/items',
				failureRedirect: '/login'
			})
		);
	}
}
