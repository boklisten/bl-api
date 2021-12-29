import { BlDocument, BlError } from "@boklisten/bl-model";

export class BlErrorLog extends BlDocument {
  code: number;
  className: string;
  methodName: string;
  msg: string;
  errorStack: BlError[];
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
