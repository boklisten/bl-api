
export class DibsEasyPayment {
	paymentId: string;
	summary: {
		reservedAmount?: number,
		chargedAmount?: number,
		refundedAmount?: number,
		cancelledAmount?: number
	};
	consumer: {
		billingAddress?: {
			addressLine1: string,
			addressLine2: string,
			receiverLine: string,
			postalCode: string,
			city: string,
			country: string
		},
		shippingAddress?: {
			addressLine1: string,
			addressLine2: string,
			receiverLine: string,
			postalCode: string,
			city: string,
			country: string
		},
		company?: {
			name: string,
			organisationNumber: string,
			email: string,
			phoneNumber: {
				prefix: string,
				number: string
			},
			merchantReference: string
		},
		privatePerson?: {
			dateOfBirth: string,
			firstName: string,
			lateName: string,
			email: string,
			phoneNumber: {
				prefix: string,
				number: string
			},
			merchantReference: string
		},
	};
	paymentDetails?: {
		paymentType: string,
		paymentMethod: string,
		invoiceDetails?: {
			invoiceNumber: string,
			ocr: string,
			pdfLink: string,
			dueDate: string
		},
		cardDetails: {
			maskedPan: string,
			expiryDate: string
		}
	};
	orderDetails: {
		amount: number,
		currency: string,
		reference: string
	};
	checkout?: {
		url: string
	};
	created: string;
	refunds?: {
		refundId: string,
		amount: number,
		state: string,
		lastUpdated: string,
		orderItems: {
			name: string,
			quantity: number,
			unit: string,
			unitPrice: number,
			taxRate: number,
			taxAmount: number,
			grossTotalAmount: number,
			netTotalAmount: number
		}[]
	}[]
}