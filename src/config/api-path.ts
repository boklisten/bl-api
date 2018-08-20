
import {APP_CONFIG} from "../application-config";

export class ApiPath {
	private baseHost: string;

	constructor() {
		this.baseHost = (APP_CONFIG.path.host) ? APP_CONFIG.path.host : 'boklisten';
	}
	
	private getBasePath(): string {
		return process.env.SERVER_PATH;
	}
	
	public createPath(customPath: string): string {
		return this.getBasePath() + customPath;
	}

	public retrieveRefererPath(reqHeaders) {
		let refererUrl = null;

		const refererPath = reqHeaders['referer'];
		const reffererPath = reqHeaders['refferer'];

		if (refererPath) {
			refererUrl = this.retrieveBasePath(refererPath);
		} else if (reffererPath) {
			refererUrl = this.retrieveBasePath(refererPath);
		}

		if (refererUrl) {
			if (refererUrl.indexOf(this.baseHost) <= -1) {
				refererUrl = null;
			}
		}

		return refererUrl;
	}

	private retrieveBasePath(url: string) {
		let pathArray: string[];
		try {
			pathArray = url.split('/');
		} catch (e) {
			return null;
		}

		const protocol = pathArray[0];
		const host = pathArray[2];
		return protocol + '//' + host + '/';
	}
}