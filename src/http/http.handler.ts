

import {BlError} from "bl-model";

export class HttpHandler {
	
	constructor() {
	
	}
	
	post(data: string, hostname: string, path: string, authorization?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const http = require('http');
			
			let headers = {
				'Content-Type': 'application/json',
				'accept': 'application/json',
			};
			
			if (authorization) {
				headers['Authorization'] = authorization;
			}
			
			const options = {
				hostname: hostname,
				port: 80,
				path: path,
				method: 'POST',
				headers: headers
			};
			
			let responseData = '';
			
			const req = http.request(options, (res) => {
				console.log('res statusCode: ', res.statusCode);
				console.log('res headers: ', JSON.stringify(res.headers));
				
				//res.setEncoding('utf8');
				/*
				res.on('data', (chunk) => {
					console.log('BODY:', chunk);
					responseData += chunk;
				});
				
				res.on('end', () => {
					console.log('here are the data: "' + responseData + '"');
					resolve(responseData);
				});
				*/
			});
			
			req.on('error', (e) => {
				reject(new BlError('problem with request').store('message', e.message));
			});
			
			req.write(data);
			req.end();
		});
	};
}