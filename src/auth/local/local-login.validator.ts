

import {LocalLoginHandler} from "./local-login.handler";
import {isEmail} from "validator";
import {LocalLogin} from "../../collections/local-login/local-login";
import {BlError} from "@wizardcoder/bl-model";
import {LocalLoginPasswordValidator} from "./password/local-login-password.validator";
import {LocalLoginCreator} from "./local-login-creator/local-login-creator";
import {UserHandler} from "../user/user.handler";
import {User} from "../../collections/user/user";

export class LocalLoginValidator {
	
	constructor(private localLoginHandler: LocalLoginHandler,
				private localLoginPasswordValidator: LocalLoginPasswordValidator,
				private localLoginCreator: LocalLoginCreator,
				private userHandler: UserHandler) {
	}
	
	public validate(username: string, password: string): Promise<{provider: string, providerId: string}> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginValidator').methodName('validate');
			if (!username || !isEmail(username)) return reject(blError.msg('username "' + username + '" is not an email'));
			if (!password || password.length <= 0) return reject(blError.msg('password is empty or undefined'));

			this.userHandler.valid(username).then(() => {
				this.localLoginHandler.get(username).then(
					(localLogin: LocalLogin) => {

						this.localLoginPasswordValidator.validate(password, localLogin.salt, localLogin.hashedPassword).then(
							(validPassword: boolean) => {
								resolve({provider: localLogin.provider, providerId: localLogin.providerId});
							},
							(error: BlError) => {
								reject(error.add(blError.msg('username or password is not correct')));
							});

					},
					(error: BlError) => {
						reject(error.add(blError.msg('could not find the user with username "' + username + '"')));
					});
			}).catch((userValidError) => {
				reject(new BlError('user not valid').code(902).add(userValidError));
			});
		});
	}
	
	public create(username: string, password: string): Promise<{provider: string, providerId: string}> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginValidator').methodName('create');
			
			this.localLoginHandler.get(username).then(
				(localLogin: LocalLogin) => {
					reject(blError.msg('username already exists').store('username', username));
				},
				(error: BlError) => {
					
					this.localLoginCreator.create(username, password).then(
						(localLogin: LocalLogin) => {
							this.localLoginHandler.add(localLogin).then(
								(addedLocalLogin: LocalLogin) => {
									this.userHandler.create(username, addedLocalLogin.provider, addedLocalLogin.providerId).then(
										(user: User) => {
											resolve({provider: user.login.provider, providerId: user.login.providerId});
										},
										(createError: BlError) => {
											reject(createError.add(blError.msg('could not create user based on the provider,providerId and username provided')));
										});
								},
								(addError: BlError) => {
									reject(addError.add(blError.msg('could not insert the localLogin object')));
								});
						},
						(localLoginCreateError: BlError) => {
							reject(localLoginCreateError.add(blError.msg('could not create LocalLogin object by the provided username and password')));
						});
				});
		});
	}
}