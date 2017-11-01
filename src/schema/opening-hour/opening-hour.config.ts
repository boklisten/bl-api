

import {EndpointConfig, Path} from "../../endpoint/endpoint.express";
import {ValidParam} from "../../query/valid-param/db-query-valid-params";
import {SESchema} from "../../config/schema/se.schema";
import {OpeningHourSchema} from "./opening-hour.schema";

export class OpeningHourConfig implements EndpointConfig {
	basePath = 'api';
	collectionName = 'openingHours';
	schema = new SESchema('openingHour', OpeningHourSchema);
	paths: Path[] = [
		{
			path: this.collectionName,
			id: false,
			methods: [
				{
					method: 'post',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				}
			]
		},
		{
			path: this.collectionName,
			id: true,
			methods: [
				{
					method: 'get',
					login: false
				},
				{
					method: 'patch',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				},
				{
					method: 'put',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				},
				{
					method: 'delete',
					login: true,
					loginOptions: {
						permissions: ["admin"]
					}
				}
			]
		}
	];
	validSearchParams: ValidParam[] = []

}