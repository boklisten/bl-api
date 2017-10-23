

import {User} from "../../config/schema/user/user";
import {SESchema} from "../../config/schema/se.schema";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";
import {SEErrorResponse} from "../../response/se.error.response";
import {UserDetail} from "../../config/schema/user/user-detail";

export class UserHandler {
	private userMongoHandler: EndpointMongodb;
	private userDetailMongoHandler: EndpointMongodb;

	constructor(userSchema: SESchema, userDetailSchema: SESchema) {
		this.userMongoHandler = new EndpointMongodb(userSchema);
		this.userDetailMongoHandler = new EndpointMongodb(userDetailSchema);
	}

	public haveUser(provider: string, providerId: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userMongoHandler.exists(this.getProviderQuery(provider, providerId)).then(
				(exists: boolean) => {
					resolve(exists);
				},
				(error) => {
					reject('there was an error when searching for user');
				});
		});
	}

	public getUser(provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			this.userMongoHandler.get(this.getProviderQuery(provider, providerId)).then(
				(docs: SEDocument[]) => {
					resolve(docs[0].data);
				},
				(error: SEErrorResponse) => {
					reject('there was an error gettin user');
				});
		});
	}

	public createUser(name: string, email: string, provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {

			let userDetail: UserDetail = {
				name: name,
				email: email
			};

			this.userDetailMongoHandler.post(new SEDocument('userDetail', userDetail)).then(
				(docs: SEDocument[]) => {

					let user: User = {
						userDetail: docs[0].data._id,
						permissionLevel: 1,
						login: {
							provider: provider,
							providerId: providerId
						}
					};

					this.userMongoHandler.post(new SEDocument('user', user)).then(
						(docs: SEDocument[]) => {
							resolve(docs[0].data);
						},
						(error: SEErrorResponse) => {
							reject('there was an error creating user document' + error);
						});

				},
				(error: SEErrorResponse) => {
					reject('could not create userDetail document..' + error);
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
