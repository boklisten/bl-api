
import {RedisHandler} from "../../db/redis/redis.handler";
import {BlError} from "../../bl-error/bl-error";
import {UserPermission} from "../user/user-permission";
import isEmail = require("validator/lib/isEmail");

export class TokenHandler {
	private jwt = require('jsonwebtoken');
	
	constructor(private redisHandler: RedisHandler) {
	
	}
	
	public createAccessToken(username: string, userid: string, permission: UserPermission, refreshToken: string) {
	
	}
	
	public validateAccessToken(accessToken: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
		
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
	
	private createJwtPayload(username: string, userid: string, permission: UserPermission) {
		return {
			//iss: this.options.iss,
			//aud: this.options.aud,
			iat: Date.now(),
			//exp: Date.now() + this.options.exp,
			permission: permission,
			//blid: blid,
			username: username
		}
	}
	
	
}