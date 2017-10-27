

import {UserPermission} from "../user/user-permission";
import {User} from "../../config/schema/user/user";
import {LoginOption} from "../../endpoint/endpoint.express";

export type JwtPayload = {
	iss: string,
	aud: string,
	iat: number,
	exp: number,
	permission: UserPermission,
	blid: string,
	username: string
}

export type ValidCustomJwtPayload = {
	permissions?: string[],
	blid?: string,
	username?: string
}

type JwtOptions = {
	exp: number,
	aud: string,
	iss: string
}


export class SEToken  {

	private jwt = require('jsonwebtoken');
	private options: JwtOptions;

	constructor(options?: JwtPayload) {
		if (options) {
			this.options = options;
		} else {
			this.options = {
				exp: 57600, //16 hours
				aud: 'boklisten.co',
				iss: 'boklisten.co'
			}
		}
	}

	public createToken(username: string, permission: UserPermission, blid: string): Promise<string> {
		if (username.length <= 0) return Promise.reject(TypeError('username "' + username + '" is to short'));
		if (permission.length <= 0) return Promise.reject(RangeError('permission is undefined'));
		if (blid.length <= 0) return Promise.reject(TypeError('blid "' + blid + '" is to short'));


		return new Promise((resolve, reject) => {
			this.jwt.sign(this.createJwtPayload(username, permission, blid), this.getSecret(),
				(error:any, token: string) => {
					if (error) {
						return reject('error creating jw token, reason: ' + error);
					}
					resolve(token);
				});
		});
	}

	public validateToken(token: string, validLoginOptions?: LoginOption): Promise<JwtPayload> {
		if (token.length <= 0) return Promise.reject(TypeError('token is empty'));

		return new Promise((resolve, reject) => {

			this.jwt.verify(token, this.getSecret(), (error: any, decoded: any) => {
				if (error) {
					return reject('error verifying token, reason: ' + error);
				}

				this.validatePayload(decoded, validLoginOptions).then(
					(jwtPayload: any) => {
						resolve(jwtPayload);
					},
					(error: any) => {
						reject(error);
					});
			})
		});
	}

	public validatePayload(jwtPayload: JwtPayload, validLoginOptions?: LoginOption): Promise<JwtPayload> {
		return new Promise((resolve, reject) => {

			if (validLoginOptions) {
				if (!validLoginOptions.restrictedToUserOrAbove) {
					if (validLoginOptions.permissions && !this.validatePermissions(jwtPayload.permission, validLoginOptions.permissions)) {
						return reject(new Error('lacking the given permissions, "' + jwtPayload.permission.toString() + '" does not include all the permissions of "' + validLoginOptions.permissions.toString() + '"'));
					}
				}
			}

			resolve(jwtPayload);
		});
	}


	public getSecret(): string {
		return 'this is the key';
	}

	public getOptions(): JwtOptions {
		return this.options;
	}

	private validateUsername(decodedUsername: string, validUsername: string): boolean {
		if (decodedUsername !== validUsername) return false;
		return true;
	}

	private validatePermissions(decodedPermission: UserPermission, validPermissions: string[]): boolean {
		if (validPermissions.indexOf(decodedPermission) <= -1) return false;
		return true;
	}

	private validateBlid(decodedBlid: string, validBlid: string): boolean {
		if (decodedBlid !== validBlid) return false;
		return true;
	}

	private createJwtPayload(username: string, permission: UserPermission, blid: string): JwtPayload {
		return {
			iss: this.options.iss,
			aud: this.options.aud,
			iat: Date.now(),
			exp: Date.now() + this.options.exp,
			permission: permission,
			blid: blid,
			username: username
		}
	}

	public permissionAbove(tokenPermission: UserPermission, permissions: UserPermission[]) {
		let lowestPermission = permissions[0];

		if (tokenPermission === lowestPermission) return true;

		if (lowestPermission === "customer") {
			if (tokenPermission === "employee") return true;
			if (tokenPermission === "admin") return true;
		}

		if (lowestPermission === "employee") {
			if (tokenPermission === "admin") return true;
		}

		return false;
	}
}