
import {RedisHandler} from "../../db/redis/redis.handler";
import {BlError} from "../../bl-error/bl-error";
import {UserPermission} from "../user/user-permission";
import isEmail = require("validator/lib/isEmail");

export class TokenHandler {
	private jwt = require('jsonwebtoken');
	
	constructor(private redisHandler: RedisHandler) {
	
	}
}