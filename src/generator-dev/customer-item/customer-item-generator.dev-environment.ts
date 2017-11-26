

import {testDataCustomerItems} from "./testdata-customer-item";
import {CustomerItemConfig} from "../../schema/customer-item/customer-item.config";
import {UserDetailConfig} from "../../config/schema/user/user-detail.config";

export class CustomerItemGeneratorDevEnvironment {
	users: any[];
	itemIds: string[];
	customerItemConfig: CustomerItemConfig;
	userDetailConfig: UserDetailConfig;
	insertedCustomerItems: any[];

	constructor() {
		this.customerItemConfig = new CustomerItemConfig();
		this.insertedCustomerItems = [];
	}

	public clearDevData() {
		this.customerItemConfig.schema.mongooseModel.remove({}, () => {});
	}

	public createDevData(users: any[], itemIds: string[], userDetailConfig: UserDetailConfig) {
		this.users = users;
		this.itemIds = itemIds;
		this.userDetailConfig = userDetailConfig;

		for (let user of this.users) {

			let customerItemsForUser = this.generateRandomAmountOfCustomerItems(user._id);
			this.customerItemConfig.schema.mongooseModel.insertMany(customerItemsForUser).then(
				(docs: any[]) => {
					let customerItemIds: any[] = [];
					for (let doc of docs) {
						this.insertedCustomerItems.push(doc);
						customerItemIds.push(doc._id);
					}

					this.userDetailConfig.schema.mongooseModel.update({_id: user.userDetail}, {customerItems: customerItemIds}).then(
						() => {

						},
						() => {
							console.log('! could not insert customerItem ids to userDetail');
						}
					)
				},
				(error: any) => {
					console.log('! could not insert customerItems', error);
				});
		}
	}

	public generateRandomAmountOfCustomerItems(userId: string): any[] {
		let randAmountHandout = Math.floor(Math.random() * 5);
		let randAmountReturned = Math.floor(Math.random() * 5);
		let randAmountNotReturned = Math.floor(Math.random() * 5);
		let customerItems: any[] = [];


		for (let i = 0; i < randAmountHandout; i++) {
			customerItems.push(this.generateHandoutCustomerItem(userId))
		}

		for (let i = 0; i < randAmountReturned; i++) {
			customerItems.push(this.generateReturnedCustomerItem(userId));
		}

		for (let i = 0; i < randAmountNotReturned; i++) {
			customerItems.push(this.generateNotReturnedCustomerItem(userId));
		}

		return customerItems;

	}

	public getCustomerItems() {
		return this.insertedCustomerItems;
	}

	private generateHandoutCustomerItem(userId: string) {
		return {
			item: this.itemIds[Math.floor(Math.random() * this.itemIds.length)],
			user: userId,
			deadline: new Date(2018, 7, 1),
			state: 'customer_have_item',
			handout: true,
			handoutTime: new Date(),
			returned: false,
			totalAmount: Math.floor(Math.random() * 800),
		}
	}

	private generateReturnedCustomerItem(userId: string) {
		return {
			item: this.itemIds[Math.floor(Math.random() * this.itemIds.length)],
			user: userId,
			deadline: new Date(2018, 7, 1),
			state: 'customer_have_item',
			handout: true,
			handoutTime: new Date(2017, 10, 1),
			returned: true,
			totalAmount: Math.floor(Math.random() * 800),
		}
	}

	private generateNotReturnedCustomerItem(userId: string) {
		return {
			item: this.itemIds[Math.floor(Math.random() * this.itemIds.length)],
			user: userId,
			deadline: new Date(2017, 1, 1),
			state: 'customer_have_item',
			handout: true,
			handoutTime: new Date(2016, 10, 1),
			returned: false,
			totalAmount: Math.floor(Math.random() * 800),
		}
	}
}