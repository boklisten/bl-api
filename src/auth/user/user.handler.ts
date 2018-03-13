

import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";

import {Blid} from "../blid/blid";
import {BlapiResponse, BlapiErrorResponse, UserDetail}  from 'bl-model';
import {BlError} from "bl-model";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {userDetailSchema} from "../../collections/user-detail/user-detail.schema";
import {User} from "../../config/schema/user/user";
import {UserSchema} from "../../config/schema/user/user.schema";

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
			
			
			this.userStorage.getByQuery({fieldName: 'username', value: username}).then(
				(docs: User[]) => {
					if (docs.length > 1) {
						reject(new BlError(`there was more than one user with username "${username}"`));
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
			
			let providerQuery = [
				{fieldName: 'login.provider', value: provider},
				{fieldName: 'login.providerId', value: providerId}
			];
			
			this.userStorage.getByQuery(providerQuery).then((users: User[]) => {
				resolve(users[0]);
			}).catch((error: BlError) => {
				reject(new BlError('an error occured when getting user')
					.store('provider', provider)
					.store('providerId', providerId));
			});
		});
	}

	public create(username: string, provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('UserHandler').methodName('create');
			
			if (!username || username.length <= 0) reject(blError.msg('username is empty or undefined'));
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty or undefined'));
			
			let userDetail: any = {
				email: username
			};
			
			this.blid.createUserBlid(provider, providerId).then((userId) => {
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
}
