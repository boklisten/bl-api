import { Router } from "express";
import { ApiPath } from "../config/api-path";
import { BlEndpoint, BlEndpointMethod } from "../collections/bl-collection";

export class MessengerEndpoint implements BlEndpoint {
  private _apiPath: ApiPath;
  method: BlEndpointMethod;
  hook?: any;
  validQueryParams: any[];
  restriction: any;

  constructor(private _router: Router) {
    this._apiPath = new ApiPath();
  }
}
