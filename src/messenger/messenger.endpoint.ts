import {Router} from "express";
import {ApiPath} from "../config/api-path";


export class MessengerEndpoint {
	private _apiPath: ApiPath;

	constructor(private _router: Router) {
		this._apiPath = new ApiPath();
	}
}