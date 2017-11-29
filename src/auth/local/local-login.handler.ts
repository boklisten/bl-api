

import {SESchema} from "../../config/schema/se.schema";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";
import {BlapiErrorResponse} from "bl-model";
import {UserHandler} from "../user/user.handler";
import {isEmail} from 'validator';
import {EndpointConfig} from "../../endpoint/endpoint.express";
import {LocalLoginConfig} from "../../config/schema/login-local/local-login.config";

export class LocalLoginHandler {
	private localLoginConfig: LocalLoginConfig;
	
	constructor(private localLoginSchema: SESchema, userHandler: UserHandler, private localLoginMongoHandler: EndpointMongodb) {
		this.localLoginConfig = new LocalLoginConfig();
	}
	
	public get(username: string): Promise<LocalLogin> {
		
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(new TypeError('username "' + username + '" is not a valid email'));
			
			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [
				{fieldName: "username", value: username}
			];
			
			this.localLoginMongoHandler.get(dbQuery).then(
				(docs: SEDocument[]) => {
					if (docs.length !== 1) {
						return reject(new Error('could not get LocalLogin by the provided username "' + username + '"'));
					}
					
					return resolve(docs[0].data as LocalLogin);
				},
				(error: BlapiErrorResponse) => {
					return reject(error);
				});
		});
	}
	
	public add(localLogin: LocalLogin): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
			if (!localLogin.username || localLogin.username.length <= 0) return reject(new TypeError('username of LocalLogin needs to be provided'));
			if (!localLogin.provider || localLogin.provider.length <= 0) return reject(new TypeError('provider of LocalLogin needs to be provided'));
			if (!localLogin.providerId || localLogin.providerId.length <= 0) return reject(new TypeError('providerId of LocalLogin needs to be provided'));
			if (!localLogin.hashedPassword || localLogin.hashedPassword.length <= 0) return reject(new TypeError('hashedPassword of LocalLogin needs to be provided'));
			if (!localLogin.salt || localLogin.salt.length <= 0) return reject(new TypeError('salt of LocalLogin needs to be provided'));
			if (!isEmail(localLogin.username)) return reject(new TypeError('username "' + localLogin.username + '" is not a valid email'));
			
			this.localLoginMongoHandler.post(new SEDocument(this.localLoginConfig.collectionName, localLogin)).then(
				(docs: SEDocument[]) => {
					if (docs.length !== 1) {
						return reject(new Error('could not add LocalLogin into database'));
					}
					return resolve(docs[0].data as LocalLogin);
				},
				(error: BlapiErrorResponse) => {
					return reject(error);
				});
		});
	}
}