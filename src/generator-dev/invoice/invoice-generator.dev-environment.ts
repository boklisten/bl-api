import {InvoiceConfig} from "../../schema/invoice/invoice.config";
import {InvoiceItemConfig} from "../../schema/invoice-tem/invoice-item.config";

export class InvoiceGeneratorDevEnvironment {
	invoiceConfig: InvoiceConfig;
	invoiceItemConfig: InvoiceItemConfig;

	constructor() {
		this.invoiceConfig = new InvoiceConfig();
		this.invoiceItemConfig = new InvoiceItemConfig();
	}

	public clearDevData() {
		this.invoiceItemConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tremoved invoiceItem collection');
		});

		this.invoiceConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tremoved invoice collection');
		});
	}

	public createDevData(users: any[], customerItems: any[]) {
		for (let user of users) {
			this.generateRandomInvoices(user, customerItems);
		}

		console.log('added some invoices');
	}

	private generateRandomInvoices(user: any, customerItems: any[]) {
		let userCustomerItems: any[] = [];

		for (let customerItem of customerItems) {
			if (customerItem.user === user._id) {
				userCustomerItems.push(customerItem);
			}
		}

		if (userCustomerItems.length > 0) {
			let invoiceCustomerItems: any[] = [];
			for (let userCustomerItem of userCustomerItems) {
				if (!userCustomerItem.returned && userCustomerItem.handout) {
					let now = new Date();
					if (userCustomerItem.deadline > now) {
						invoiceCustomerItems.push(userCustomerItem);
					}
				}
			}

			this.createInvoice(user._id, invoiceCustomerItems).then(
				(invoice: any) => {
					this.invoiceConfig.schema.mongooseModel.insertMany([invoice]).then(
						() => {

						},
						(error: any) => {
							console.log('! could not create invoice');
						});
				});
		}

	}

	private createInvoice(userId: string, customerItems: any[]): any {
		return new Promise((resolve, reject) => {

			this.createInvoiceItems(userId, customerItems).then(
				(invoiceItems: any[]) => {
					let fee = 0;
					let amount = 0;
					let invoiceItemIds: string[] = [];

					for (let invoiceItem of invoiceItems) {
						amount += invoiceItem.amount;
						fee += invoiceItem.fee;
						invoiceItemIds.push(invoiceItem._id);
					}

					resolve({
							amount: amount,
							fee: fee,
							deadline: new Date(2018, 10, 1),
							user: userId,
							invoiceItems: invoiceItemIds
						});
				},
				() => {
					reject('could not create invoice');
				});
		});
	}

	private createInvoiceItems(userId: string, customerItems: any[]): Promise<any[]> {
		return new Promise((resolve, reject) => {

			let invoiceItems: any[] = [];

			for (let customerItem of customerItems) {
				invoiceItems.push(this.createInvoiceItem(customerItem.item, customerItem._id, userId));
			}

			this.invoiceItemConfig.schema.mongooseModel.insertMany(invoiceItems).then(
				(docs: any[]) => {
					resolve(docs);
				},
				(error: any) => {
					reject('could not insert invoiceItems');
				});
		});
	}

	private createInvoiceItem(itemId: string, customerItemId: string, userId: string) {
		return {
			item: itemId,
			customerItem: customerItemId,
			user: userId,
			amount: Math.floor((Math.random() * 1500) + 50),
			fee: 90,
			deadline: new Date(2017, 1, 1),
		}
	}
}
