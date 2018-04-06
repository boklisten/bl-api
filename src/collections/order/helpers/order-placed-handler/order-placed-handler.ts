
import {Order, CustomerItem, OrderItem, BlError} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {customerItemSchema} from "../../../customer-item/customer-item.schema";
import {SystemUser} from "../../../../auth/permission/permission.service";
import {orderSchema} from "../../order.schema";

export class OrderPlacedHandler {
	private customerItemStorage: BlDocumentStorage<CustomerItem>;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>, orderStorage?: BlDocumentStorage<Order>) {
		this.customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
	}
	
	public createCustomerItems(order: Order): Promise<Order> {
		return new Promise((resolve, reject) => {
			
			let customerItemPromArr: Promise<CustomerItem>[] = [];
			
			for (let orderItem of order.orderItems) {
				if (orderItem.type === "rent") {
					let newCustomerItem: CustomerItem = {
						id: '',
						item: orderItem.item,
						deadline: orderItem.info.to,
						handout: false,
						returned: false,
						orders: [order.id]
					};
					
					customerItemPromArr.push(this.customerItemStorage.add(newCustomerItem, new SystemUser()));
				}
			}
			
			Promise.all(customerItemPromArr).then((customerItems: CustomerItem[]) => {
				for (let customerItem of customerItems) {
					for (let i = 0; i < order.orderItems.length; i++) {
						if (order.orderItems[i].item === customerItem.item) {
							order.orderItems[i].info.customerItem = customerItem.id;
							break;
						}
					}
				}
				
				this.orderStorage.update(order.id, order, new SystemUser()).then((updatedOrder: Order) => {
					resolve(updatedOrder);
				}).catch((blError: BlError) => {
					return reject(blError);
				});
			}).catch((blError: BlError) => {
				return Promise.reject(blError);
			});
		});
		
	}
}