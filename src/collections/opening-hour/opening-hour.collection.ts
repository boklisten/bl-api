

import {BlCollection, BlEndpoint} from "../bl-collection";
import {openingHourSchema} from "./opening-hour.schema";
import {Schema} from "mongoose";

export class OpeningHourCollection implements BlCollection {
	collectionName = 'openinghours';
	mongooseSchema = openingHourSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getId'
		},
		{
			method: 'post',
			restriction: {
				permissions: ['admin', 'super']
			}
		},
		{
			method: 'patch',
			restriction: {
				permissions: ['admin', 'super']
			}
		}
	]
}