import { Router } from "express";

import { BlEndpoint, BlEndpointMethod } from "../collections/bl-collection";
import { ApiPath } from "../config/api-path";

export class MessengerEndpoint implements BlEndpoint {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  method: BlEndpointMethod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hook?: any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validQueryParams: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  restriction: any;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  constructor(private _router: Router) {
    new ApiPath();
  }
}
