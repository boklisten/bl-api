
export type ValidParam = {
	fieldName: string,
	type: 'string' | 'number' | 'boolean'
}

export class DbQueryValidParams {
	private validParams: ValidParam[];

	constructor(validParams: ValidParam[]) {
		this.validParams = validParams;
	}

	public getValidNumberParams(): string[] {
		return this.getValidParamsBasedOnType('number');
	}

	public getValidStringParams(): string[] {
		return this.getValidParamsBasedOnType('string');
	}

	public getValidBooleanParams(): string[] {
		return this.getValidParamsBasedOnType('boolean');
	}

	public getAllValidParams(): string[] {
		let allValidParams: string[] = [];

		for (let validParam of this.validParams) {
			allValidParams.push(validParam.fieldName);
		}

		return allValidParams;
	}

	private getValidParamsBasedOnType(type: string) {
		let validParamsBasedOnType: string[] = [];

		for (let validParam of this.validParams) {
			if (validParam.type === type) {
				validParamsBasedOnType.push(validParam.fieldName);
			}
		}

		return validParamsBasedOnType;
	}




}
