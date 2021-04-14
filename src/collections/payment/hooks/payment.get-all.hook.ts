import { Hook } from "../../../hook/hook";
import {
  BlDocument,
  BlError,
  Order,
  Payment,
  AccessToken,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { paymentSchema } from "../payment.schema";
import { DibsPaymentService } from "../../../payment/dibs/dibs-payment.service";
import { DibsEasyOrder } from "../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import { SystemUser } from "../../../auth/permission/permission.service";
import { orderSchema } from "../../order/order.schema";
import { PaymentValidator } from "../helpers/payment.validator";
import { isNullOrUndefined } from "util";
import { PaymentDibsHandler } from "../helpers/dibs/payment-dibs-handler";
import { PermissionService } from "../../../auth/permission/permission.service";

export class PaymentGetAllHook extends Hook {
  private _permissionService: PermissionService;

  constructor() {
    super();
    this._permissionService = new PermissionService();
  }

  public async before(
    body: any,
    accessToken?: AccessToken,
    id?: string,
    query?: any
  ): Promise<boolean> {
    if (
      !this._permissionService.isPermissionOver(
        accessToken.permission,
        "customer"
      )
    ) {
      if (!query || !query["info.paymentId"]) {
        throw new BlError("no permission");
      }

      if (query["info.paymentId"].length <= 10) {
        throw new BlError("no permission");
      }
    }

    return true;
  }

  public async after(payments: Payment[]): Promise<any> {
    return payments;
  }
}
