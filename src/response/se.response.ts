

import {Response} from 'express';
import {SEDocument} from "../db/model/se.document";

export class SEResponse {
	status: number;
	docs: SEDocument[] | null;

	constructor(docs: SEDocument[] | null = null, status: number = 200) {
		this.status = status;
		this.docs = docs;
	}
}
