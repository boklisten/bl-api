import { BlDocument, BlError } from "@boklisten/bl-model";

export class BlErrorLog extends BlDocument {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  code: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  className: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  methodName: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  msg: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  errorStack: BlError[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: { key: string; value: any }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;

  constructor(blError?: BlError) {
    super();

    if (blError) {
      this.code = blError.getCode();
      this.className = blError.getClassName();
      this.methodName = blError.getMethodName();
      this.msg = blError.getMsg();
      this.errorStack = blError.errorStack;
      this.data = blError.getData();
      this.store = blError.getStore();
    }
  }
}
