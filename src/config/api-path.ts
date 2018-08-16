
import {APP_CONFIG} from "../application-config";

export class ApiPath {
	constructor() {
	
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

		return refererUrl;
	}

	private retrieveBasePath(url: string) {
		const pathArray = url.split('/');
		const protocol = pathArray[0];
		const host = pathArray[2];
		return protocol + '//' + host + '/';
	}
}