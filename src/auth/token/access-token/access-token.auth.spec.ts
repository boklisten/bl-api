import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {UserHandler} from "../../user/user.handler";
import {User} from "../../../config/schema/user/user";
import {Promise} from 'es6-promise';
import {AccessTokenAuth} from "./access-token.auth";
import {SESchema} from "../../../config/schema/se.schema";
import {UserSchema} from "../../../config/schema/user/user.schema";
import {UserDetailSchema} from "../../../config/schema/user/user-detail.schema";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
chai.use(chaiAsPromised);

let testUsername = 'bill@thesite.com';

class UserHandlerMock extends UserHandler {
	
	constructor() {
		super(new EndpointMongodb(new SESchema('', UserSchema)),
			new EndpointMongodb(new SESchema('', UserDetailSchema)));
	}
	
	get(provider: string, providerId: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let user: User = {
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
