
import { BlEndpoint, BlEndpointMethod } from '../../collections/bl-collection';
import { CustomerItem } from '@wizardcoder/bl-model';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';


export class MessengerReminderEndpoint implements BlEndpoint {
  method: BlEndpointMethod;

  constructor(private customerItemStorage: BlDocumentStorage<CustomerItem>) {
    this.method = 'post';
  }
}
