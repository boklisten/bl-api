import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {RedisHandler} from "../../db/redis/redis.handler";
import {TokenHandler} from "./token.handler";
import {BlError} from "../../bl-error/bl-error";
import {UserPermission} from "../user/user-permission";
import {Promise} from 'es6-promise';

chai.use(chaiAsPromised);

class RedisHandlerMock extends RedisHandler {
	
	constructor() {
		super();
	}

}

describe('TokenHandler', () => {
	let redisHandlerMock = new RedisHandlerMock();
	let tokenHandler = new TokenHandler(redisHandlerMock);
	
});