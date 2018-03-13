import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {UserHandler} from "../../user/user.handler";
import {User} from "../../../collections/user/user";
import {Promise} from 'es6-promise';
import {AccessTokenAuth} from "./access-token.auth";
chai.use(chaiAsPromised);

let testUsername = 'bill@thesite.com';

class UserHandlerMock extends UserHandler {
	
	constructor() {
		super();
	}
	
	get(provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let user: User = {
				id: '',
				username: testUsername,
				permission: 'customer',
				login: {
					provider: provider,
					providerId: providerId
				},
				blid: 'abc',
				userDetail: '123',
				valid: true
			};
			resolve(user);
		});
	}
}

describe('AccessTokenAuth', () => {

});
