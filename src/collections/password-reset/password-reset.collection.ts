import {BlCollection, BlEndpoint} from "../bl-collection";
import {passwordResetSchema} from "./password-reset.schema";
import {PasswordResetPostHook} from "./hooks/password-reset-post.hook";
import {Schema} from "mongoose";
import {PasswordResetOperation} from "./operations/password-reset.operation";

export class PasswordResetCollection implements BlCollection {
	public collectionName = 'passwordresets';
	public mongooseSchema = passwordResetSchema;
	public endpoints: BlEndpoint[] = [
		{
			method: 'post',
			hook: new PasswordResetPostHook()
		},
		{
			method: 'getId',
			operations: [
				{
					name: 'reset',
					operation: new PasswordResetOperation()
				}
			]
		}
	]
}