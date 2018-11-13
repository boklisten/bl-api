import { CustomerItem, BlError, UserDetail } from '@wizardcoder/bl-model';
import { BlDocumentStorage } from '../../storage/blDocumentStorage';
import { SEDbQuery } from '../../query/se.db-query';
import moment = require('moment');
import { CustomerItemHandler } from '../../collections/customer-item/helpers/customer-item-handler';
import { EmailService } from '../email/email-service';
import { userDetailSchema } from '../../collections/user-detail/user-detail.schema';

export class MessengerReminder {
  private customerItemHandler: CustomerItemHandler;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private emailService: EmailService; 

  constructor(customerItemHandler?: CustomerItemHandler, userDetailStorage?: BlDocumentStorage<UserDetail>, emailService?: EmailService) {
    this.customerItemHandler = (customerItemHandler) ? customerItemHandler : new CustomerItemHandler();
    this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage<UserDetail>('userdetails', userDetailSchema);
    this.emailService = (emailService) ? emailService : new EmailService();
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
   *  @param messageId if provided, stores message info in that message object
   */
  public async remindCustomer(customerId: string, deadline: Date, messageId?: string): Promise<any> {
    if (customerId == null || customerId.length <= 0) {
      throw new BlError('customerId is null or undefined');
    }

    if (deadline == null) {
      throw new BlError('deadline is null or undefined');
    }

    try {
      const notReturnedCustomerItems = await this.customerItemHandler.getNotReturned(customerId, deadline);
      const userDetail = await this.userDetailStorage.get(customerId);
      await this.emailService.remind(userDetail, notReturnedCustomerItems);
    } catch (e) {
      throw e;
    }

    return true;
  }
}
