import {BlEndpoint} from "../../collections/bl-collection";
import {AccessToken, BlError} from "@wizardcoder/bl-model";
import * as passport from "passport";
import {NextFunction, Request, Response} from "express";
import {SEResponseHandler} from "../../response/se.response.handler";


export class CollectionEndpointAuth {
	private _authStrategy = 'jwt';

	public authenticate(endpoint: BlEndpoint, req: Request, res: Response, next: NextFunction): Promise<AccessToken | boolean> {
		return new Promise((resolve, reject) => {
			if (endpoint.restriction) { // it is a restriction on this endpoint and authentication is required
				passport.authenticate(this._authStrategy, (err, tokens: { accessToken: AccessToken }, info) => {
					try {
						this.validateAuth(endpoint, tokens.accessToken);
						return resolve(tokens.accessToken);
					} catch (e) { // if authorization tokens is not valid
						return reject(e)
					}
				})(req, res, next);
			} else { // no authentication needed
				return resolve(true);
			}
		});
	}

	private validateAuth(endpoint: BlEndpoint, accessToken: AccessToken): boolean {
		if (!accessToken) {
			throw new BlError('accessToken not found').code(911);
		}

		if (endpoint.restriction && endpoint.restriction.permissions) {
			if (endpoint.restriction.permissions.indexOf(accessToken.permission) <= -1) {
				throw new BlError(`user "${accessToken.sub}" with permission "${accessToken.permission}" does not have access to this endpoint`).code(904);
			}
		}

		return true;
	}
}