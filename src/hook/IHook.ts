
export interface IHook {
	run(docs?: any[], req?: any, res?: any): Promise<boolean>;
}