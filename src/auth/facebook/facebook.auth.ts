

import {Router} from 'express';

import * as passport from "passport";
import {secrets} from "../../config/secrets";
import {Strategy} from 'passport-facebook'

export class FacebookAuth {

	constructor(router: Router, app: any) {
		passport.use(new Strategy({
				clientID: secrets.boklistentest.facebook.clientId,
				clientSecret: secrets.boklistentest.facebook.secret,
				callbackURL: "http://localhost:3000/api/auth/facebook/callback"

			},
			function(accessToken: any, refreshToken: any, profile: any, done: any) {
				console.log('hello there, at: ', accessToken, ' rt: ', refreshToken, ' p: ', profile);
				return done(null, profile);
			}
		));

		this.createAuthGet(router, app);
		this.createCallbackGet(router, app);
	}

	private createAuthGet(router: Router, app: any) {
		app.get('/api/auth/facebook',
			passport.authenticate('facebook', {scope: ['public_profile']}));
	}

	private createCallbackGet(router: Router, app: any) {
		app.get('/api/auth/facebook/callback',
			passport.authenticate('facebook', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				res.redirect('/hello');
			});

		app.get('/login', (req: any, res: any) => {
			res.send('you need to login...');
			res.end();
		});

		app.get('/hello', (req: any, res: any) => {
			res.send('hello there ' + req.user.displayName);
			console.log('the user', req.user.id, req.user.name);
			res.end();
		})
	}

}
