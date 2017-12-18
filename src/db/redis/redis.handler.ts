
import {RedisClient} from "redis";
import {BlError} from "../../bl-error/bl-error";

const redis = require('redis');
const bluebird = require('bluebird');
const appConfing = require('../../application-config').APP_CONFIG;

export class RedisHandler {
	private redisClient: RedisClient;
	
	constructor() {
		if (!appConfing.test) this.redisClient = redis.createClient();
		bluebird.promisifyAll(redis.RedisClient.prototype);
		bluebird.promisifyAll(redis.Multi.prototype);
	}
	
	public add(key: string, value: any): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.redisClient.set(key, value, (error, reply) => {
				if (error || reply === null) reject(new BlError('could not insert value with "'+ key + '"')
					.className('RedisHandler')
					.methodName('add'));
				return resolve(true);
			});
		});
	}
	
	public addWithExpire(key: string, value: any, millisec: number): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.redisClient.set(key, value, "PX", millisec, (error, reply) => {
				if (error || reply == null) reject(new BlError('could not insert value with "' + key + '"')
					.className('RedisHandler')
					.methodName('addWithExpire'));
				return resolve(true);
			});
		});
	}
	
	public get(key: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.redisClient.get(key, (error, value) => {
		    	if (error || value === null) reject(new BlError('could not get value with key "' + key + '"')
					.className('RedisHandler')
					.methodName('get')
					.code(702));
		    	return resolve(value);
			});
		});
	}
	
	public remove(key: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.redisClient.del(key, (error, reply) => {
				if (error || reply === null) reject(new BlError('could not delete value with key "' + key + '"')
					.className('RedisHandler')
					.methodName('remove')
					.code(702));
				return resolve(true);
			});
		});
	}
	
}