import { BlEndpoint } from '../../endpoint/bl-endpoint';
import { BlEndpointMethod } from '../../endpoint/bl-endpoint-method';

/**
 * Enpoint for reminding a customer of undelivered items
 */
export class MessengerRemindEndpoint implements BlEndpoint {
  method: BlEndpointMethod;

  constructor() {
    this.method = 'post';
  }

}
