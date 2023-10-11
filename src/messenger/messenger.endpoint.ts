import { Router } from "express";

import { BlEndpoint, BlEndpointMethod } from "../collections/bl-collection";
import { ApiPath } from "../config/api-path";

export class MessengerEndpoint implements BlEndpoint {
  method: BlEndpointMethod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hook?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validQueryParams: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  restriction: any;

  constructor(private _router: Router) {
    new ApiPath();
  }
}
