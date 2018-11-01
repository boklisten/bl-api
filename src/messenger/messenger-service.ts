import {Message} from "./message";
import {Order, UserDetail, CustomerItem} from "@wizardcoder/bl-model";

export type CustomerDetailWithCustomerItem = { customerDetail: UserDetail, customerItems: CustomerItem[] };

export interface MessengerService {

	send(messages: Message[], customerDetail: UserDetail): void;
	sendMany(messages: Message[], customerDetails: UserDetail[]): void;

	remind(customerDetail: UserDetail, customerItems: CustomerItem[]): void;
  remindMany(customerDetailsWithCustomerItems: CustomerDetailWithCustomerItem[]): void;

	orderPlaced(customerDetail: UserDetail, order: Order): void;

	emailConfirmation(customerDetail: UserDetail, code: string): void;
	passwordReset(customerDetail: UserDetail, code: string): void;
}
