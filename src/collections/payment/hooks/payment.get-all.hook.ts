import { Hook } from "../../../hook/hook";
import { BlError, Payment, AccessToken } from "@boklisten/bl-model";
import { PermissionService } from "../../../auth/permission/permission.service";

export class PaymentGetAllHook extends Hook {
  private _permissionService: PermissionService;

  constructor() {
    super();
    this._permissionService = new PermissionService();
  }

  public override async before(
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

  public override async after(payments: Payment[]): Promise<any> {
    return payments;
  }
}
