import { BlEndpointRestriction } from "./bl-endpoint-restriction";
import { Operation } from "../operation/operation";

export interface BlEndpointOperation {
  name: string;
  operation: Operation;
  restriction?: BlEndpointRestriction;
}
