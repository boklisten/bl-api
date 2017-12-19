
import {BlError} from "../../bl-error/bl-error";
import {RefreshTokenCreator} from "./refresh/refresh-token.creator";
import {AccessTokenCreator} from "./access-token/access-token.creator";
import {UserHandler} from "../user/user.handler";
import {User} from "../../config/schema/user/user";
import {TokenConfig} from "./token.config";

export class TokenHandler {
	private refreshTokenCreator: RefreshTokenCreator;
	private accessTokenCreator: AccessTokenCreator;
	
	constructor(private userHandler: UserHandler, tokenConfig: TokenConfig) {
		this.refreshTokenCreator = new RefreshTokenCreator(tokenConfig);
		this.accessTokenCreator = new AccessTokenCreator(tokenConfig);
	}
	
	public createTokens(username: string): Promise<{accessToken: string, refreshToken: string}> {
		return new Promise((resolve, reject) => {
			this.userHandler.getByUsername(username).then(
				(user: User) => {
					this.refreshTokenCreator.create(user.username, user.blid).then(
						(refreshToken: string) => {
							this.accessTokenCreator.create(user.username, user.blid, user.permission, user.userDetail, refreshToken).then(
								(accessToken: string) => {
									resolve({accessToken: accessToken, refreshToken: refreshToken});
								},
								(accessTokenCreationError: BlError) => {
									reject(new BlError('failed to create accessToken')
										.code(906)
										.add(accessTokenCreationError));
								});
						},
						(refreshTokenCreatorError: BlError) => {
							reject(new BlError('failed to create refreshToken')
								.code(906)
								.add(refreshTokenCreatorError));
						});
				},
				(getUserError: BlError) => {
					reject(new BlError('could not get user with username "' + username + '"')
						.add(getUserError)
						.code(906));
				});
		});
	}
}