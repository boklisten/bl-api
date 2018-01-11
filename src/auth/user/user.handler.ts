

import {User} from "../../config/schema/user/user";
import {SESchema} from "../../config/schema/se.schema";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";

import {UserDetail} from "../../config/schema/user/user-detail";
import {Blid} from "../blid/blid";
import {BlapiResponse, BlapiErrorResponse} from 'bl-model';
import {BlError} from "bl-model";

export class UserHandler {
	private userMongoHandler: EndpointMongodb;
	private userDetailMongoHandler: EndpointMongodb;
	private blid: Blid;

	constructor(userMongoHandler: EndpointMongodb, userDetailMongoHandler: EndpointMongodb) {
		this.userMongoHandler = userMongoHandler;
		this.userDetailMongoHandler = userDetailMongoHandler;
		this.blid = new Blid();
	}

	public exists(provider: string, providerId: string): Promise<boolean> {
		let blError = new BlError('').className('userHandler').methodName('exists');
		
		return new Promise((resolve, reject) => {
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty or undefined'));
			
			this.userMongoHandler.exists(this.getProviderQuery(provider, providerId)).then(
				(exists: boolean) => {
					resolve(exists);
				},
				(existsError: BlError) => {
					reject(new BlError('there was an error when searching for user')
						.store('provider', provider)
						.store('providerId', providerId)
						.add(existsError));
				});
		});
	}
	
	public getByUsername(username: string): Promise<User> {
		return new Promise((resolve, reject) => {
			if (!username) return reject(new BlError('username is empty or undefined'));
			
			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [{fieldName: 'username', value: username}];
			
			this.userMongoHandler.get(dbQuery).then(
				(docs: SEDocument[]) => {
					resolve(docs[0].data as User);
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
			
			this.userMongoHandler.get(this.getProviderQuery(provider, providerId)).then(
				(docs: SEDocument[]) => {
					resolve(docs[0].data as User);
				},
				(error: BlError) => {
					reject(error.add(blError.msg('there was an error getting the user')
							.store('provider', provider)
							.store('providerId', providerId)));
				});
		});
	}

	public create(username: string, provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let blError =  new BlError('').className('UserHandler').methodName('create');
			
			if (!username || username.length <= 0) reject(blError.msg('username is empty or undefined'));
			if (!provider || provider.length <= 0) reject(blError.msg('provider is empty or undefined'));
			if (!providerId || providerId.length <= 0) reject(blError.msg('providerId is empty or undefined'));
	
			let userDetail: UserDetail = {
				email: username
			};
			

			this.userDetailMongoHandler.post(new SEDocument('userDetail', userDetail)).then(
				(docs: SEDocument[]) => {
					this.blid.createUserBlid(provider, providerId).then(
						(userBlid: string) => {

							let user: User = {
								userDetail: docs[0].data._id,
								permission: "customer",
								blid: userBlid,
								username: username,
								valid: false, //customer needs to register minimal information to rent items
								login: {
									provider: provider,
									providerId: providerId
								}
							};

							this.userMongoHandler.post(new SEDocument('user', user)).then(
								(docs: SEDocument[]) => {
									resolve(docs[0].data);
								},
								(error: BlError) => {
									reject(error.add(blError.msg('there was an error creating user document').store('user', user)));
								});
							},
						(error: BlError) => {
							reject(error.add(blError.msg('there was an error creating the blid').store('provider', provider).store('providerId', providerId)));
						});
				},
				(error: BlError) => {
					reject(error.add(blError.msg('could not create userDetail document').store('username', username).store('provider', provider).store('providerId', providerId)));
				});
		});
	}

	private getProviderQuery(provider: string, providerId: string): SEDbQuery {
		let dbQuery = new SEDbQuery();

		dbQuery.stringFilters = [
			{fieldName: 'login.provider', value: provider},
			{fieldName: 'login.providerId', value: providerId}
		];

		return dbQuery;
	}
}
