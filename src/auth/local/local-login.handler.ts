import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";
import {BlapiErrorResponse, BlError} from "bl-model";
import {isEmail} from 'validator';
import {LocalLoginConfig} from "../../config/schema/login-local/local-login.config";

export class LocalLoginHandler {
	private localLoginConfig: LocalLoginConfig;
	
	constructor(private localLoginMongoHandler: EndpointMongodb) {
		this.localLoginConfig = new LocalLoginConfig();
	}
	
	public get(username: string): Promise<LocalLogin> {
		let blError = new BlError('').className('LocalLoginHandler').methodName('get');
		
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(blError.msg('username "' + username + '" is not a valid email'));
			
			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [
				{fieldName: "username", value: username}
			];
			
			this.localLoginMongoHandler.get(dbQuery).then(
				(docs: SEDocument[]) => {
					if (docs.length !== 1) {
						return reject(blError.msg('could not get LocalLogin by the provided username "' + username + '"').store('username', username));
					}
					return resolve(docs[0].data as LocalLogin);
				},
				(error: BlError) => {
					return reject(error.add(blError.msg('could not find localLogin object').store('username', username)));
				});
		});
	}
	
	public add(localLogin: LocalLogin): Promise<LocalLogin> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('LocalLoginHandler').methodName('add');
			if (!localLogin.username || localLogin.username.length <= 0) return reject(blError.msg('username of LocalLogin needs to be provided'));
			if (!localLogin.provider || localLogin.provider.length <= 0) return reject(blError.msg('provider of LocalLogin needs to be provided'));
			if (!localLogin.providerId || localLogin.providerId.length <= 0) return reject(blError.msg('providerId of LocalLogin needs to be provided'));
			if (!localLogin.hashedPassword || localLogin.hashedPassword.length <= 0) return reject(blError.msg('hashedPassword of LocalLogin needs to be provided'));
			if (!localLogin.salt || localLogin.salt.length <= 0) return reject(blError.msg('salt of LocalLogin needs to be provided'));
			if (!isEmail(localLogin.username)) return reject(blError.msg('username "' + localLogin.username + '" is not a valid email'));
			
			this.localLoginMongoHandler.post(new SEDocument(this.localLoginConfig.collectionName, localLogin)).then(
				(docs: SEDocument[]) => {
					if (docs.length !== 1) {
						return reject(new Error('could not create LocalLogin into database'));
					}
					return resolve(docs[0].data as LocalLogin);
				},
				(error: BlapiErrorResponse) => {
					return reject(error);
				});
		});
	}
}