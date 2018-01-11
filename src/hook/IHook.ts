
export interface IHook {
	run(docs?: any[]): Promise<boolean>;
}