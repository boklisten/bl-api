

export class SEErrorResponse {
	status: number;
	msg: string;
	data: string;

	constructor(status: number, msg: string = '', data: string = '') {
		this.status = status;
		this.msg = msg;
		this.data = data;
	}
}
