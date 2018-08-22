

export type DateFilter = {
	fieldName: string,
	op: {
		$lt: Date,
		$gt: Date,
		$gte: Date,
		$eq: Date
	}
}

export class DbQueryDateFilter {
	private operationIdentifiers = [
		//{op: '$gt', op}
	]
}