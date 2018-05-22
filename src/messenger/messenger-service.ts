import {Message} from "./message";
import {Order, UserDetail} from "@wizardcoder/bl-model";


export interface MessengerService {

	send(messages: Message[], customerDetail: UserDetail): void;
	sendMany(messages: Message[], customerDetails: UserDetail[]): void;

	remind(customerDetail: UserDetail): void;
	remindMany(customerDetails: UserDetail[]): void;

	orderPlaced(customerDetail: UserDetail, order: Order): void;

	emailConfirmation(customerDetail: UserDetail, code: string): void;
	passwordReset(customerDetail: UserDetail, code: string): void;
}