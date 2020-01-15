import {Order, UserDetail, BlError, Delivery} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {deliverySchema} from '../../../delivery/delivery.schema';
import {dateService} from '../../../../blc/date.service';

// branch id in PROD : 5b6442ebd2e733002fae8a31
// branch id in DEV :
// branch id in LOCAL : 5db00e6bcbfeed32123184c3
export class Matcher {
  private matchingWindow: {fromHour: number; toHour: number};
  constructor(private deliveryStorage?: BlDocumentStorage<Delivery>) {
    this.deliveryStorage = this.deliveryStorage
      ? this.deliveryStorage
      : new BlDocumentStorage<Delivery>('deliveries', deliverySchema);

    this.matchingWindow = {
      fromHour: 8,
      toHour: 20,
    };
  }

  // 1 check if order is on correct branch
  // 2 check if payment is of type later
  // 3 check if time is inside period
  // 4 match finder check for match
  // 5 notify sender and reciever
  public async match(order: Order, userDetail: UserDetail): Promise<any> {
    const validBranches = [
      '5b6442ebd2e733002fae8a31',
      '5db00e6bcbfeed32123184c3',
      '',
    ];

    if (validBranches.indexOf(order.branch as string) < 0) {
      throw new BlError('trying to match with order not in matching-branches');
    }

    if (order.payments.length <= 0) {
      throw new BlError('payment is not present on order');
    }

    if (order.delivery) {
      try {
        const delivery: Delivery = await this.deliveryStorage.get(
          order.delivery as string,
        );
        if (delivery.method !== 'branch') {
          throw new BlError('delivery does not have method "branch"');
        }
      } catch (e) {
        throw e;
      }
    }

    if (!this.validateCreationTime(order)) {
      throw new BlError(
        'order.creationTime is not in time for the matching-window',
      );
    }

    throw 'not implemented';
  }

  private validateCreationTime(order: Order) {
    return dateService.betweenHours(
      order.creationTime,
      this.matchingWindow.fromHour,
      this.matchingWindow.toHour,
      'Europe/Oslo',
    );
  }
}
