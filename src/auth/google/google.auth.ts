
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";

export class GoogleAuth {

	constructor(router: Router, app: any) {
		passport.use(new OAuth2Strategy({
				clientID: secrets.boklistentest.google.clientId,
				clientSecret: secrets.boklistentest.google.secret,
				callbackURL: "/api/auth/google/callback"

			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {

			console.log('email: ', profile.emails);

				let user = {name: profile.name.givenName + ' ' + profile.name.familyName, email: profile.emails[0].value};
				return done(null, user);
			}
		));

		this.createAuthGet(router, app);
		this.createCallbackGet(router, app);
	}

	private createAuthGet(router: Router, app: any) {
		app.get('/api/auth/google',
			passport.authenticate('google', {scope: ['profile', 'email'] }));
	}

	private createCallbackGet(router: Router, app: any) {
		app.get('/api/auth/google/callback',
			passport.authenticate('google', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.redirect('/hello');
			});

		app.get('/login', (req: any, res: any) => {
			res.send('you need to login...');
		});

		app.get('/hello', (req: any, res: any) => {
			res.send('hello there ' + req.user.name + ' your email is ' + req.user.email);
		})
	}

}
