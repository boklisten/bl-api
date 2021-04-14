import { BlEndpointMethod } from "./bl-endpoint-method";
import { BlEndpointRestriction } from "./bl-endpoint-restriction";
import { Hook } from "../hook/hook";
import { BlEndpointOperation } from "./bl-endpoint-operation";

/**
 * A general web-endpoint. Should be used when a
 * regular CollectionEnpoint is not suitable. For
 * example when you need a path for starting a process
 * like send email to all users.
 */
export interface BlEndpoint {
  // what method to be used, like POST or GET
  method: BlEndpointMethod;

  // Will be called by the runner if specified.
  hook?: Hook;

  // If set, this endpoint will have restricted access.
  restriction?: BlEndpointRestriction;

  // Outside of the regular methods, it can also have operations
  operations?: BlEndpointOperation[];
}
