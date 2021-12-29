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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    accessToken?: AccessToken,
    id?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public override async after(payments: Payment[]): Promise<any> {
    return payments;
  }
}
