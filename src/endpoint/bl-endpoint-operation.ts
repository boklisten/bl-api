import { Operation } from '../operation/operation';
import { BlEndpointRestriction } from './bl-endpoint-restriction';

export interface BlEndpointOperation {
	name: string;
	operation: Operation;
	restriction?: BlEndpointRestriction;
}
