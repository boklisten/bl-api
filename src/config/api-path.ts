
import {APP_CONFIG} from "../application-config";

export class ApiPath {
	constructor() {
	
	}
	
	private getBasePath(): string {
		return process.env.BL_API_PATH + '/';
	}
	
	public createPath(customPath: string): string {
		return this.getBasePath() + customPath;
	}
}