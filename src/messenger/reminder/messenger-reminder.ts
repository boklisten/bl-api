import { CustomerItem, BlError } from '@wizardcoder/bl-model';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';
import { SEDbQuery } from '../../query/se.db-query';
import moment = require('moment');
import { CustomerItemHandler } from '../../collections/customer-item/helpers/customer-item-handler';

export class MessengerReminder {
  private customerItemHandler: CustomerItemHandler;

  constructor(customerItemHandler?: CustomerItemHandler) {
    this.customerItemHandler = (customerItemHandler) ? customerItemHandler : new CustomerItemHandler();
  }
  
  /**
   *  Tries to remind all customers to return items that have the specified deadline
   *  @param deadline the deadline the reminder is for
   */
  public remindAll(deadline: Date) {
  }

  /**
   *  Reminds a customer to return a item with the specified deadline
   *  @param customerId the customers id
   *  @param deadline the deadline the reminder is for
   */
  public async remindCustomer(customerId: string, deadline: Date): Promise<any> {
    if (customerId == null || customerId.length <= 0) {
      throw new BlError('customerId is null or undefined');
    }

    if (deadline == null) {
      throw new BlError('deadline is null or undefined');
    }

    const notReturnedCustomerItems = await this.customerItemHandler.getNotReturned(customerId, deadline);
   
    return [];
  }
}
