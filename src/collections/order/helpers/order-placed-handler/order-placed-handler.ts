
import {
	Order,
	CustomerItem,
	OrderItem,
	BlError,
	AccessToken,
	Payment,
	UserDetail,
	Delivery
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {customerItemSchema} from "../../../customer-item/customer-item.schema";
import {orderSchema} from "../../order.schema";
import {PaymentHandler} from "../../../payment/helpers/payment-handler";
import {userDetailSchema} from "../../../user-detail/user-detail.schema";
import {EmailService} from "../../../../messenger/email/email-service";
import {deliverySchema} from "../../../delivery/delivery.schema";
import {Messenger} from "../../../../messenger/messenger";

export class OrderPlacedHandler {
	private customerItemStorage: BlDocumentStorage<CustomerItem>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentHandler: PaymentHandler;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	private _messenger: Messenger;
	
	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>, orderStorage?: BlDocumentStorage<Order>, paymentHandler?: PaymentHandler, userDetailStorage?: BlDocumentStorage<UserDetail>) {
		this.customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentHandler = (paymentHandler) ? paymentHandler : new PaymentHandler();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this.deliveryStorage = new BlDocumentStorage<Delivery>('deliveries', deliverySchema);
		this._messenger = new Messenger();
	}
	
	public placeOrder(order: Order, accessToken: AccessToken): Promise<Order> {
		return new Promise((resolve, reject) => {
			this.paymentHandler.confirmPayments(order, accessToken).then((confirmedPayments: Payment[]) => {
				this.orderStorage.update(order.id, {placed: true}, {id: accessToken.sub, permission: accessToken.permission}).then((placedOrder: Order) => {

					this.updateUserDetailWithPlacedOrder(placedOrder, accessToken).then(() => {

						this.sendOrderConfirmationMail(order);

						resolve(placedOrder);
					}).catch((updateUserDetailError: BlError) => {
						reject(updateUserDetailError);
					});

				}).catch((orderUpdateError: BlError) => {
					reject(new BlError('order could not be updated').add(orderUpdateError));
				});

			}).catch((confirmPaymentsError: BlError) => {
				reject(new BlError('order.payments could not be confirmed').add(confirmPaymentsError));
			});
		});
	}
	
	private updateUserDetailWithPlacedOrder(order: Order, accessToken: AccessToken): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userDetailStorage.get(order.customer).then((userDetail: UserDetail) => {
				let orders = (userDetail.orders) ? userDetail.orders : [];
				orders.push(order.id);
				
				this.userDetailStorage.update(order.customer, {orders: orders}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedUserDetail: UserDetail) => {
					resolve(true);
				}).catch((updateUserDetailError: BlError) => {
					reject(new BlError('could not update userDetail with placed order'));
				});

			}).catch((getUserDetailError: BlError) => {
				reject(new BlError(`customer "${order.customer}" not found`).add(getUserDetailError));
			});
		});
	}

	private sendOrderConfirmationMail(order: Order) {
		this.userDetailStorage.get(order.customer).then((customerDetail: UserDetail) => {
			this._messenger.orderPlaced(customerDetail, order);
		}).catch((getCustomerDetailError) => {

		})
	}
}