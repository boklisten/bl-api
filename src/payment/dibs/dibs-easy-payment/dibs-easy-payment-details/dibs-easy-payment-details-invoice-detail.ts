import {JsonMember, JsonObject} from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentDetailsInvoiceDetail {
	@JsonMember({type: String})
	invoiceNumber: string;
	@JsonMember({type: String})
	ocr: string;
	@JsonMember({type: String})
	pdfLink: string;
	@JsonMember({type: String})
	dueDate: string
}