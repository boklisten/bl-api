import {BlDocument} from "@wizardcoder/bl-model";

export class PasswordReset extends BlDocument {
	email: string;
	token?: string;
	userDetail?: string;
}
