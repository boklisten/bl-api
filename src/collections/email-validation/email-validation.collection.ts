import {BlCollection, BlEndpoint} from "../bl-collection";
import {emailValidationSchema} from "./email-validation.schema";
import {EmailValidationConfirmOperation} from "./operations/email-validation-confirm.operation";
import {Schema} from "mongoose";


export class EmailValidationCollection implements BlCollection {
	public collectionName = 'email_validations';
	public mongooseSchema = emailValidationSchema;
	public endpoints: BlEndpoint[] = [
		{
			method: 'post',
			restriction: {
				permissions: ['customer', 'employee', 'admin'],
				restricted: true
			}
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['super']
			},
			operations: [
				{
					name: 'confirm',
					operation: new EmailValidationConfirmOperation()
				}
			]
		}
	]
}