

import {SEDbQuery} from "../../query/se.db-query";

import {Blid} from "../blid/blid";
import {UserDetail, BlError}  from '@wizardcoder/bl-model';
import {User} from "../../collections/user/user";
import {UserSchema} from "../../collections/user/user.schema";
import {userDetailSchema} from "../../collections/user-detail/user-detail.schema";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {PasswordReset} from "../../collections/password-reset/password-reset";

export class UserHandler {
	private blid: Blid;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private userStorage: BlDocumentStorage<User>;

	constructor(userDetailStorage?: BlDocumentStorage<UserDetail>, userStorage?: BlDocumentStorage<User>) {
		this.blid = new Blid();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this.userStorage = (userStorage) ? userStorage : new BlDocumentStorage('users', UserSchema);
	}
	
	public getByUsername(username: string): Promise<User> {
		return new Promise((resolve, reject) => {
			if (!username) return reject(new BlError('username is empty or undefined'));
			
			
			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [
				{fieldName: 'username', value: username}
			];
			
			
			this.userStorage.getByQuery(dbQuery).then(
				(docs: User[]) => {
					if (docs.length !== 1) {
						reject(new BlError(`username "${username}" was not found`).code(702));
					}
					resolve(docs[0]);
				},
				(error: BlError) => {
					reject(new BlError('could not find user with username "' + username + '"')
						.add(error)
						.code(702));
				});
		});
	}

	public get(provider: string, providerId: string): Promise<User> {
		let blError = new BlError('').className('userHandler').methodName('exists')
		
		
		return new Promise((resolve, reject) => {
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty of undefined'));
			
			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [
				{fieldName: 'login.provider', value: provider},
				{fieldName: 'login.providerId', value: providerId}
			];
			
			this.userStorage.getByQuery(dbQuery).then((users: User[]) => {
				resolve(users[0]);
			}).catch((error: BlError) => {
				reject(new BlError('an error occured when getting user')
					.store('provider', provider)
					.store('providerId', providerId).add(error));
			});
		});
	}

	public create(username: string, provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('UserHandler').methodName('create');
			
			if (!username || username.length <= 0) reject(blError.msg('username is empty or undefined'));
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty or undefined'));
			

			this.blid.createUserBlid(provider, providerId).then((userId) => {
				let userDetail: any = {
					email: username,
					blid: userId
				};

				return this.userDetailStorage.add(userDetail, {id: userId, permission: "customer"});
			}).then(addedUserDetail => {
				let user: User = {
					id: '',
					userDetail: addedUserDetail.id,
					permission: "customer",
					blid: addedUserDetail.user.id,
					username: username,
					valid: false,
					login: {
						provider: provider,
						providerId: providerId
					}
				};
				return this.userStorage.add(user, {id: addedUserDetail.user.id, permission: user.permission});
			}).then(user => {
				resolve(user);
			}).catch((blError: BlError) => {
				reject(new BlError(`failed to create user with username "${username}"`).add(blError));
			});
			
		});
	}
	
	public exists(provider: string, providerId: string): Promise<boolean> {
		if (!provider || !providerId) {
			return Promise.reject(new BlError('provider or providerId is empty or undefinedl'));
		}
		
		let dbQuery = new SEDbQuery();
		dbQuery.stringFilters = [
			{fieldName: "login.provider", value: provider},
			{fieldName: "login.providerId", value: providerId}
		];
		
		return new Promise((resolve, reject) => {
			this.userStorage.getByQuery(dbQuery).then((users: User[]) => {
				resolve(true);
			}).catch((blError: BlError) => {
				reject(new BlError('does not exist').add(blError));
			});
		});
	}
}
