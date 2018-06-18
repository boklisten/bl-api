
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
	private _messenger: Messenger;
	
	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>,
				orderStorage?: BlDocumentStorage<Order>,
				paymentHandler?: PaymentHandler,
				userDetailStorage?: BlDocumentStorage<UserDetail>,
				messenger?: Messenger) {
		this.customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentHandler = (paymentHandler) ? paymentHandler : new PaymentHandler();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._messenger = (messenger) ? messenger : new Messenger();
	}
	
	public placeOrder(order: Order, accessToken: AccessToken): Promise<Order> {
			let placedOrder: Order;
			return this.userDetailStorage.get(order.customer)
				.then((userDetail: UserDetail) => {
					if (!userDetail.emailConfirmed) {
						throw new BlError('userDetail.emailConfirmed is not true');
					}

					return this.paymentHandler.confirmPayments(order, accessToken);
				}).then(() => {
					return this.orderStorage.update(order.id, {placed: true}, {
						id: accessToken.sub,
						permission: accessToken.permission
					});
				}).then((updatedOrder: Order) => {
					placedOrder = updatedOrder;
					return this.updateUserDetailWithPlacedOrder(placedOrder, accessToken);
				}).then(() => {
					this.sendOrderConfirmationMail(placedOrder);
					return placedOrder;
				}).catch((placedOrderError: BlError) => {
					throw new BlError('order could not be placed').add(placedOrderError);
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