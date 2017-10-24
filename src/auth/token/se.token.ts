

export type JwtPayload = {
	iss: string,
	aud: string,
	iat: number,
	exp: number,
	permissions: string[],
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
	aud: string
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
				aud: 'www.boklisten.co'
			}
		}
	}

	public createToken(username: string, permissions: string[], blid: string): Promise<string> {
		console.log('create token is called with: ', username, permissions, blid);
		if (username.length <= 0) return Promise.reject(TypeError('username "' + username + '" is to short'));
		if (permissions.length <= 0) return Promise.reject(RangeError('permission array has zero or none values'));
		if (blid.length <= 0) return Promise.reject(TypeError('blid "' + blid + '" is to short'));


		return new Promise((resolve, reject) => {
			this.jwt.sign(this.createJwtPayload(username, permissions, blid), this.getSecret(),
				(error:any, token: string) => {
					if (error) {
						return reject('error creating jw token, reason: ' + error);
					}
					resolve(token);
				});
		});
	}

	public validateToken(token: string, validOptions?: ValidCustomJwtPayload): Promise<JwtPayload> {
		if (token.length <= 0) return Promise.reject(TypeError('token is empty'));

		return new Promise((resolve, reject) => {

			this.jwt.verify(token, this.getSecret(), (error: any, decoded: any) => {
				if (error) {
					return reject('error verifying token, reason: ' + error);
				}

				if (validOptions) {
					if (validOptions.permissions && !this.validatePermissions(decoded.permissions, validOptions.permissions)) {
						return reject('lacking the given permissions, "' + validOptions.permissions.toString() + '" does not include all the permissions of "' + validOptions.permissions.toString() + '"');
					}

					if (validOptions.blid && !this.validateBlid(decoded.blid, validOptions.blid)) {
						return reject('the decoded blid "' + decoded.blid + '" is not like the valid blid "' + validOptions.blid  + '"');
					}

					if (validOptions.username && !this.validateUsername(decoded.username, validOptions.username)) {
						return reject('the decoded username "' + decoded.username + '" is not equal the valid username "' + validOptions.username + '"');
					}
				}

				resolve(decoded);
			})
		});
	}

	private validateUsername(decodedUsername: string, validUsername: string): boolean {
		if (decodedUsername !== validUsername) return false;
		return true;
	}

	private validatePermissions(decodedPermissions: string[], validPermissions: string[]): boolean {
		for (let permission of decodedPermissions) {
			if (validPermissions.indexOf(permission) <= -1) return false;
		}
		return true;
	}

	private validateBlid(decodedBlid: string, validBlid: string): boolean {
		if (decodedBlid !== validBlid) return false;
		return true;
	}

	private createJwtPayload(username: string, permissions: string[], blid: string): JwtPayload {
		return {
			iss: username,
			aud: this.options.aud,
			iat: Date.now(),
			exp: Date.now() + this.options.exp,
			permissions: permissions,
			blid: blid,
			username: username
		}
	}

	private getSecret(): string {
		return 'this is the key';
	}
}