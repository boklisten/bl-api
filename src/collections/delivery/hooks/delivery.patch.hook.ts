import {Delivery, Order, BlError, AccessToken} from '@wizardcoder/bl-model';
import {Hook} from '../../../hook/hook';
import {DeliveryValidator} from '../helpers/deliveryValidator/delivery-validator';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {isNullOrUndefined} from 'util';
import {orderSchema} from '../../order/order.schema';
import {DeliveryHandler} from '../helpers/deliveryHandler/delivery-handler';
import {deliverySchema} from '../delivery.schema';

export class DeliveryPatchHook extends Hook {
  private deliveryValidator?: DeliveryValidator;
  private deliveryStorage: BlDocumentStorage<Delivery>;
  private orderStorage: BlDocumentStorage<Order>;
  private deliveryHandler: DeliveryHandler;

  constructor(
    deliveryValidator?: DeliveryValidator,
    deliveryStorage?: BlDocumentStorage<Delivery>,
    orderStorage?: BlDocumentStorage<Order>,
    deliveryHandler?: DeliveryHandler,
  ) {
    super();
    this.deliveryValidator = deliveryValidator
      ? deliveryValidator
      : new DeliveryValidator();
    this.deliveryStorage = deliveryStorage
      ? deliveryStorage
      : new BlDocumentStorage<Delivery>('deliveries', deliverySchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage<Order>('orders', orderSchema);
    this.deliveryHandler = deliveryHandler
      ? deliveryHandler
      : new DeliveryHandler();
  }

  before(body: any, accessToken?: AccessToken, id?: string): Promise<boolean> {
    if (body === null || isNullOrUndefined(body)) {
      return Promise.reject(new BlError('body is undefined'));
    }

    if (isNullOrUndefined(id)) {
      return Promise.reject(new BlError('id is undefined'));
    }

    if (isNullOrUndefined(accessToken)) {
      return Promise.reject(new BlError('accessToken is undefined'));
    }

    return this.tryToValidatePatch(body, accessToken, id)
      .then(() => {
        return true;
      })
      .catch((blError: BlError) => {
        return Promise.reject(blError);
      });
  }

  after(deliveries: Delivery[], accessToken: AccessToken): Promise<Delivery[]> {
    let delivery = deliveries[0];

    return new Promise((resolve, reject) => {
      this.orderStorage
        .get(delivery.order as string)
        .then((order: Order) => {
          this.deliveryValidator
            .validate(delivery, order)
            .then(() => {
              this.deliveryHandler
                .updateOrderBasedOnMethod(delivery, order, accessToken)
                .then((updatedDelivery: Delivery) => {
                  return resolve([updatedDelivery]);
                })
                .catch((blError: BlError) => {
                  return reject(blError);
                });
            })
            .catch((blError: BlError) => {
              return reject(blError);
            });
        })
        .catch((blError: BlError) => {
          return reject(blError);
        });
    });
  }

  private tryToValidatePatch(
    body: any,
    accessToken: AccessToken,
    id: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.deliveryStorage
        .get(id)
        .then((delivery: Delivery) => {
          if (body['info']) {
            delivery.info = body['info'];
          }

          if (body['amount'] >= 0) {
            delivery.amount = body['amount'];
          }

          if (body['order']) {
            delivery.order = body['order'];
          }
          if (body['method']) {
            delivery.method = body['method'];
          }

          this.orderStorage
            .get(delivery.order as string)
            .then((order: Order) => {
              this.deliveryValidator
                .validate(delivery, order)
                .then(() => {
                  return resolve(true);
                })
                .catch((blError: BlError) => {
                  return reject(
                    new BlError('patched delivery could not be validated')
                      .add(blError)
                      .store('delivery', delivery),
                  );
                });
            })
            .catch((blError: BlError) => {
              return reject(
                new BlError(`order "${delivery.order}" not found`).add(blError),
              );
            });
        })
        .catch((blError: BlError) => {
          return reject(new BlError(`delivery "${id}" not found`).add(blError));
        });
    });
  }
}
