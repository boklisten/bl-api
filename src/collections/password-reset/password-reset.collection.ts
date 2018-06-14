import {BlCollection, BlEndpoint} from "../bl-collection";
import {passwordResetSchema} from "./password-reset.schema";
import {PasswordResetPostHook} from "./hooks/password-reset-post.hook";
import {Schema} from "mongoose";
import {PasswordResetOperation} from "./operations/password-reset.operation";
import {PasswordResetNewOperation} from "./operations/password-reset-new.operation";

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
			restriction: {
				permissions: ['super']
			},
			operations: [
				{
					name: 'reset',
					operation: new PasswordResetOperation()
				}
			]
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['super']
			},
			operations: [
				{
					name: 'new',
					operation: new PasswordResetNewOperation()
				}
			]
		}
	]
}