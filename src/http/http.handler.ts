

import {BlError} from "bl-model";
const querystring = require('querystring');
const qs = require('qs');
const request = require('request')

export class HttpHandler {
	
	constructor() {
	
	}
	
	post(url: string, data: any, authorization?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			
			const options = {
				url: url,
				json: data,
				headers: {}
			};
			
			if (authorization) {
				options['headers']['Authorization'] = authorization;
			}
			
		    request.post(options, (err, res, body) => {
		    	if (err) {
		    		return reject(new BlError(`error on request to "${url}"`));
				}
				
				if (res && res.statusCode) {
		    		if (res.statusCode == 200 || res.statusCode === 201) {
		    			return resolve(body);
					}
					
					return reject(new BlError(`the request to "${url} responded with status ${res.statusCode}`).store('body', body));
				}
			});
		});
	};
}