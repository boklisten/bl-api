
export type ValidParam = {
	param: string,
	type: 'string' | 'number'
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


	private getValidParamsBasedOnType(type: string) {
		let validParamsBasedOnType: string[] = [];

		for (let validParam of this.validParams) {
			if (validParam.type === type) {
				validParamsBasedOnType.push(validParam.param);
			}
		}

		return validParamsBasedOnType;
	}


}
