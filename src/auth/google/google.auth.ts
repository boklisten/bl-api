
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";

export class GoogleAuth {
	userHandler: UserHandler;

	constructor(router: Router, userHandler: UserHandler) {
		this.userHandler = userHandler;

		passport.use(new OAuth2Strategy({
				clientID: secrets.boklistentest.google.clientId,
				clientSecret: secrets.boklistentest.google.secret,
				callbackURL: "/api/auth/google/callback"
			},
			(accessToken: any, refreshToken: any, profile: any, done: any) => {
				let provider = 'google';
				let providerId = profile.id;
				let name = profile.name.givenName + ' ' + profile.name.familyName;
				let email = profile.email = profile.emails[0].value;

				this.userHandler.getOrCreateUser(provider, providerId, name, email).then(
					(user: User) => {
						return done(null, user);
					},
					(error) => {
						console.log('there was an error getting or creation user ', error);
					});
			}
		));

		this.createAuthGet(router);
		this.createCallbackGet(router);
	}

	private createAuthGet(router: Router) {
		router.get('/api/auth/google',
			passport.authenticate('google', {scope: ['profile', 'email'] }));
	}

	private createCallbackGet(router: Router) {
		router.get('/api/auth/google/callback',
			passport.authenticate('google', { failureRedirect: '/login' }),
			(req: any, res: any) => {
				console.log('the user', req.user);
				res.redirect('/api/items');
			});
	}

}
