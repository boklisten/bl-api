

import {BlCollection, BlEndpoint} from "../bl-collection";
import {openingHourSchema} from "./opening-hour.schema";

export class OpeningHourCollection implements BlCollection {
	collectionName = 'openinghours';
	mongooseSchema = openingHourSchema;
	endpoints: BlEndpoint[] = [
		{
			method: 'getId'
		}
	]
}