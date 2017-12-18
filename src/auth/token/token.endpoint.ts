

import {Router} from "express";
import {ApiPath} from "../../config/api-path";
import {SEResponseHandler} from "../../response/se.response.handler";
import {RefreshTokenValidator} from "./refresh/refresh-token.validator";
import {BlError} from "../../bl-error/bl-error";

export class TokenEndpoint {
	private apiPath: ApiPath;
	private refreshTokenValidator: RefreshTokenValidator;
	
	constructor(private router: Router, private resHandler: SEResponseHandler) {
		this.apiPath = new ApiPath();
		this.createPostEndpoint();
		this.refreshTokenValidator = new RefreshTokenValidator();
	
	}
	
	createPostEndpoint() {
		this.router.post(this.apiPath.createPath('token'), (req, res) => {
			if (req.body) {
				if (req.body['refreshToken']) {
					this.refreshTokenValidator.validate(req.body['refreshToken']).then(
						(valid: boolean) => {
							res.send('valid token!!');
						},
						(refreshTokenValidationError: BlError) => {
							this.resHandler.sendErrorResponse(res, new BlError('refreshToken not valid')
								.code(909)
								.add(refreshTokenValidationError));
						});
				}
			}
		});
	}
}