
import {secrets} from "../../config/secrets";

import {Router} from 'express';

import {OAuth2Strategy} from 'passport-google-oauth';
import * as passport from "passport";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";
import {SEToken} from "../token/se.token";

export class GoogleAuth {
	private userHandler: UserHandler;
	private seToken: SEToken;

	constructor(router: Router, userHandler: UserHandler) {
		this.userHandler = userHandler;
		this.seToken = new SEToken();

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
						this.seToken.createToken(user.username, user.permissions, user.blid).then(
							(jwtoken: string) => {
								console.log('the jwtoken    ', jwtoken);
								return done(null, jwtoken);

							},
							(error: any) => {
								return done(new Error('could not create jw token, reason: ' + error));
							});
					},
					(error) => {
						return done(new Error('could not get or create user, reason: ' + error));
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
				res.send(req.user);
				//res.redirect('/show/jwt');

			});


		router.get('/show/jwt', (req: any, res: any) => {
			res.send('hello there');
		})
	}

}
