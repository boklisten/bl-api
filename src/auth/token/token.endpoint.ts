

import {Router} from "express";
import {ApiPath} from "../../config/api-path";
import {SEResponseHandler} from "../../response/se.response.handler";
import {RefreshTokenValidator} from "./refresh/refresh-token.validator";
import {BlError} from "../../bl-error/bl-error";
import {TokenHandler} from "./token.handler";
import {RefreshToken} from "./refresh/refresh-token";
import {BlapiResponse} from "bl-model";
import {SEDocument} from "../../db/model/se.document";

export class TokenEndpoint {
	private apiPath: ApiPath;
	private refreshTokenValidator: RefreshTokenValidator;
	
	constructor(private router: Router, private resHandler: SEResponseHandler, private tokenHandler: TokenHandler) {
		this.apiPath = new ApiPath();
		this.createPostEndpoint();
		this.refreshTokenValidator = new RefreshTokenValidator();
	}
	
	createPostEndpoint() {
		this.router.post(this.apiPath.createPath('token'), (req, res) => {
			if (req.body && req.body['refreshToken']) {
				this.refreshTokenValidator.validate(req.body['refreshToken']).then(
					(refreshToken: RefreshToken) => {
						this.tokenHandler.createTokens(refreshToken.username).then(
							(jwTokens: {accessToken: string, refreshToken: string}) => {
								this.resHandler.sendResponse(res, new BlapiResponse([
									new SEDocument('accessToken', jwTokens.accessToken),
									new SEDocument('refreshToken', jwTokens.refreshToken)
								]));
							},
							(createTokenError: BlError) => {
								this.resHandler.sendErrorResponse(res, new BlError('could not create tokens')
									.store('oldRefreshToken', req.body['refreshToken'])
									.code(906)
									.add(createTokenError));
							});
					},
					(refreshTokenValidationError: BlError) => {
						this.resHandler.sendErrorResponse(res, new BlError('refreshToken not valid')
							.code(909)
							.add(refreshTokenValidationError));
					});
			} else {
				this.resHandler.sendErrorResponse(res, new BlError('bad format').code(701));
			}
		});
	}
}