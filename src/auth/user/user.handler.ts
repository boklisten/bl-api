

import {User} from "../../config/schema/user/user";
import {SESchema} from "../../config/schema/se.schema";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";

import {UserDetail} from "../../config/schema/user/user-detail";
import {Blid} from "../blid/blid";
import {BlapiResponse, BlapiErrorResponse} from 'bl-model';
import {BlError} from "../../bl-error/bl-error";

export class UserHandler {
	private userMongoHandler: EndpointMongodb;
	private userDetailMongoHandler: EndpointMongodb;
	private blid: Blid;

	constructor(userSchema: SESchema, userDetailSchema: SESchema) {
		this.userMongoHandler = new EndpointMongodb(userSchema);
		this.userDetailMongoHandler = new EndpointMongodb(userDetailSchema);
		this.blid = new Blid();
	}

	public getOrCreateUser(provider: string, providerId: string, name: string): Promise<User> {
		return new Promise((resolve, reject) => {
			this.haveUser(provider, providerId).then(
				(haveUser: boolean) => {
					if (haveUser) {
						this.getUser(provider, providerId).then(
							(user: User) => {
								resolve(user);
							},
							(error) => {
								reject('error getting user, reason: ' + error);

							});
					} else {
						this.createUser(name, provider, providerId).then(
							(user: User) => {
								resolve(user);
							},
							(error) => {
								reject('error creating user, reason: ' +  error);
							});
					}
				},
				(error) => {
					reject('error when checking for user, reason: ' + error);
				});
		});
	}

	private haveUser(provider: string, providerId: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userMongoHandler.exists(this.getProviderQuery(provider, providerId)).then(
				(exists: boolean) => {
					resolve(exists);
				},
				(error) => {
					reject('there was an error when searching for user, reason: ' + error);
				});
		});
	}

	private getUser(provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			this.userMongoHandler.get(this.getProviderQuery(provider, providerId)).then(
				(docs: SEDocument[]) => {
					resolve(docs[0].data);
				},
				(error: BlapiErrorResponse) => {
					reject('there was an error getting the user, reason: ' + error.msg);
				});
		});
	}

	private createUser(name: string, provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let blError =  new BlError('').className('UserHandler').methodName('createUser');
	
			let userDetail: UserDetail = {
				name: name,
			};
			

			this.userDetailMongoHandler.post(new SEDocument('userDetail', userDetail)).then(
				(docs: SEDocument[]) => {
					this.blid.createUserBlid(provider, providerId).then(
						(userBlid: string) => {

							let user: User = {
								userDetail: docs[0].data._id,
								permission: "customer",
								blid: userBlid,
								username: name,
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
								(error: BlapiErrorResponse) => {
									reject('there was an error creating user document, reason: ' + error);
								});
							},
						(error: any) => {
							reject('there was an error creating the blid, reason: ' + error);
						});
				},
				(error: BlapiErrorResponse) => {
					reject('could not create userDetail document, reason: ' + error);
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
