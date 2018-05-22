import {EmailService} from "./email/email-service";
import {BlError, Order, UserDetail} from "@wizardcoder/bl-model";
import {Message} from "./message";
import {MessengerService} from "./messenger-service";

export class Messenger implements MessengerService {
	private _emailService: EmailService;

	constructor() {
		this._emailService = new EmailService();
	}

	/**
	 * send out message(s) to the customer
	 * @param {Message[]} messages
	 * @param {UserDetail} customerDetail
	 */
	public send(messages: Message[], customerDetail: UserDetail) {
		this._emailService.send(messages, customerDetail);
	}

	/**
	 * send out message(s) to the customer
	 * @param {Message[]} messages
	 * @param {UserDetail[]} customerDetails
	 */
	public sendMany(messages: Message[], customerDetails: UserDetail[]) {
		this._emailService.sendMany(messages, customerDetails);
	}

	/**
	 * reminds the customer of the due date of his items
	 * @param {UserDetail} customerDetail
	 */
	public remind(customerDetail: UserDetail) {
		this._emailService.remind(customerDetail);
	}

	/**
	 * sends out reminders to more than one customer
	 * @param {UserDetail[]} customerDetails
	 */
	public remindMany(customerDetails: UserDetail[]) {
		this._emailService.remindMany(customerDetails);
	}

	/**
	 * sends out notifications to the customer when order is placed
	 * @param {UserDetail} customerDetail
	 * @param {Order} order
	 */
	public orderPlaced(customerDetail: UserDetail, order: Order) {
		this._emailService.orderPlaced(customerDetail, order);
	}

	/**
	 * sends out message to customer with a link to confirm email
	 * @param {UserDetail} customerDetail
	 * @param {string} confirmationCode
	 */
	public emailConfirmation(customerDetail: UserDetail, confirmationCode: string) {

	}

	/**
	 * sends out message to customer with a link to reset password
	 * @param {UserDetail} customerDetail
	 * @param {string} passwordResetCode
	 */
	public passwordReset(customerDetail: UserDetail, passwordResetCode: string) {

	}
}