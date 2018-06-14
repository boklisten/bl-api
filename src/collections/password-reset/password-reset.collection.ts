import {BlCollection, BlEndpoint} from "../bl-collection";
import {passwordResetSchema} from "./password-reset.schema";
import {PasswordResetPostHook} from "./hooks/password-reset-post.hook";


export class PasswordResetCollection implements BlCollection {
	public collectionName = 'passwordresets';
	public mongooseSchema = passwordResetSchema;
	public endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new PasswordResetPostHook(),
			restriction: {
				permissions: ['customer', 'employee', 'admin', 'super']
			}
		}
	]
}