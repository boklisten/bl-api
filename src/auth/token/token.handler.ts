
import {RedisHandler} from "../../db/redis/redis.handler";
import {BlError} from "../../bl-error/bl-error";
import {UserPermission} from "../user/user-permission";
import isEmail = require("validator/lib/isEmail");

export class TokenHandler {
	private jwt = require('jsonwebtoken');
	
	constructor(private redisHandler: RedisHandler) {
	
	}
	
	public createAccessToken(username: string, userid: string, permission: UserPermission, refreshToken: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!username || !userid || !refreshToken) return reject(new BlError('parameter is empty or undefined').className('TokenHandler').methodName('createAccessToken'));
			
			this.validateRefreshToken(refreshToken).then(
				(valid: boolean) => {
					this.jwt.sign(this.createAccessTokenPayload(username, userid, permission), this.getAccessTokenSecret(), (error: any, accessToken: string) => {
						if (error) return reject(new BlError('could not sign jwt').store('usename', username).store('permission', permission).code(905));
						return resolve(accessToken);
					});
				},
				(refreshTokenError: BlError) => {
					reject(new BlError('refreshToken is not valid')
						.add(refreshTokenError)
						.code(905));
				});
		});
	}
	
	public validateAccessToken(accessToken: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!accessToken) reject(new BlError('accessToken is empty or undefined'));
			
			try {
				this.jwt.verify(accessToken, this.getAccessTokenSecret(), (error, decoded) => {
					if (error) return reject(new BlError('could not verify jwt').store('accessToken', accessToken).code(905));
				});
				resolve(true);
			} catch (error) {
				
				return reject(new BlError('could not verify accessToken')
					.code(905));
			}
		});
	}
	
	public createRefreshToken(username: string, userid: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('')
				.className('TokenHandler')
				.methodName('createRefreshToken')
				.store('username', username)
				.store('userid', userid);
			
			if (!username || !isEmail(username)) return reject(blError.msg('username is undefined or not an email').code(103));
			if (!userid || userid.length <= 0) return reject(blError.msg('userid is empty or undefined').code(103));
			
			this.jwt.sign(this.createRefreshTokenPayload(username, userid), this.getRefreshTokenSecret(),
				(error: any, refreshToken: string) => {
					if (error) return reject(blError.msg('could not create refreshToken').code(906));
					resolve(refreshToken);
				});
		});
	}
	
	public validateRefreshToken(refreshToken: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!refreshToken || refreshToken.length <= 0) reject(new BlError('refreshToken is empty or undefined').className('TokenHandler').methodName('validateRefreshToken'));
			
			try {
				this.jwt.verify(refreshToken, this.getRefreshTokenSecret(), (error: any, decoded: any) => {
					if (error) return reject(new BlError('could not validate token').className('TokenHandler').className('TokenHandler').methodName('validateRefreshToken').code(905));
					resolve(true);
				});
			} catch (error) {
				reject(new BlError('could not validate token')
					.className('TokenHandler')
					.methodName('validateRefreshToken')
					.store('jwt error', error)
					.code(905));
			}
		});
	}
	
	create(username: string, userid: string, permission: string): Promise<{accessToken: string, refreshToken: string}> {
		return new Promise((resolve, reject) => {
			let blError = new BlError('').className('TokenHandler').methodName('create');
			if (!username || username.length <= 0) reject(blError.msg('username is empty or undefined').code(103));
			if (!userid || userid.length <= 0) reject(blError.msg('userid is empty or undefined').code(103));
			if (!permission || permission.length <= 0) reject(blError.msg('permission is empty or undefined').code(103));
			
		});
	}
	
	private getRefreshTokenSecret(): string {
		return 'secret';
	}
	
	private getAccessTokenSecret(): string {
		return 'anotherSecret';
	}
	
	private createRefreshTokenPayload(username: string, userid: string) {
		return {
			iss: '',
			aut: '',
			iat: Date.now(),
			exp: Date.now() + 16000,
			username: username,
			userid: userid
		}
	}
	
	private createAccessTokenPayload(username: string, userid: string, permission: string) {
		return {
			iss: '',
			aut: '',
			iat: Date.now(),
			exp: Date.now() + 100,
			username: username,
			userid: userid,
			permission: permission
		}
	}
	
}