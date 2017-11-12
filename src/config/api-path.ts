
import {APP_CONFIG} from "../application-config";

export class ApiPath {
	constructor() {
	
	}
	
	public getBasePath(): string {
		if (APP_CONFIG.test) {
			return APP_CONFIG.dev.server.path + '/' + APP_CONFIG.dev.server.version;
		}
		return APP_CONFIG.prod.server.path + '/' + APP_CONFIG.prod.server.version;
	}
}