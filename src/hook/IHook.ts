
export interface IHook {
	run(err: any, next?: IHook, req?: any, res?: any): void;
}