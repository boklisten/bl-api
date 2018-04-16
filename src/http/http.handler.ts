

import {BlError} from "@wizardcoder/bl-model";
const querystring = require('querystring');
const qs = require('qs');
const request = require('request');
const rp = require('request-promise');

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
					
					return reject(new BlError(`the request to "${url}" responded with status ${res.statusCode}`).store('body', body));
				}
			});
		});
	};
	
	public getWithQuery(url: string, queryString: string, authorization?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			
			let options = {
				uri: url + '?' + queryString,
				json: true,
			};
			
			rp(options).then((jsonResponse) => {
				resolve(jsonResponse);
			}).catch((error) => {
				reject(new BlError('could not get page with query').store('responseError', error).store('uri', url + '?' + queryString));
			})
		
		});
	}
	
	public get(url: string, authorization?: string): Promise<any> {
		return new Promise((resolve, reject) => {
		 	let options = {
		 		uri: url,
				json: true,
				headers: {}
			};
		 	
		 	if (authorization) {
				options['headers']['Authorization'] = authorization;
			}
			
			rp(options).then((jsonResponse) => {
		 		resolve(jsonResponse);
			}).catch((error) => {
		 		reject(new BlError(`could not get the requested resorce at "${url}"`).store('error', error));
			})
			
		});
	}
	
	public createQueryString(data: any): string {
		return qs.stringify(data);
	}
}