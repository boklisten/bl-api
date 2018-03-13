import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {LocalLogin} from "../../config/schema/login-local/local-login";
import {SEDbQuery} from "../../query/se.db-query";
import {SEDocument} from "../../db/model/se.document";
import {BlapiErrorResponse, BlError} from "bl-model";
import {isEmail} from 'validator';
import {LocalLoginConfig} from "../../config/schema/login-local/local-login.config";
import {BlStorageHandler} from "../../storage/blStorageHandler";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {LocalLoginSchema} from "../../config/schema/login-local/local-login.schema";

export class LocalLoginHandler {
	private localLoginConfig: LocalLoginConfig;
	private localLoginStorage: BlDocumentStorage<LocalLogin>;
	
	constructor(localLoginStorage?: BlDocumentStorage<LocalLogin>) {
		this.localLoginConfig = new LocalLoginConfig();
		this.localLoginStorage = (localLoginStorage) ? localLoginStorage : new BlDocumentStorage('locallogins', LocalLoginSchema);
	}
	
	public get(username: string): Promise<LocalLogin> {
		
		return new Promise((resolve, reject) => {
			if (!username || !isEmail(username)) return reject(new BlError(`username "${username}" is not a valid email`));
			
			this.localLoginStorage.getByQuery({username: {$eq: username}}).then((localLogins: LocalLogin[]) => {
				
					if (localLogins.length !== 1) {
						return reject(new BlError('could not get LocalLogin by the provided username "' + username + '"').store('username', username));
					}
					return resolve(localLogins[0]);
				}).catch((error: BlError) => {
					return reject(new BlError(`could not get localLogin with username "${username}"`).code(702).add(error));
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
			
			this.localLoginStorage.add(localLogin, {id: 'SYSTEM', permission: "admin"}).then((localLogin: LocalLogin) => {
				return resolve(localLogin);
			}).catch((error: BlapiErrorResponse) => {
				return reject(error);
			});
		});
	}
}