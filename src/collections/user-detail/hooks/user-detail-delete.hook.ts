import { Hook } from "../../../hook/hook";
import { UserDetail, AccessToken, BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { OrderActive } from "../../order/helpers/order-active/order-active";
import { CustomerHaveActiveCustomerItems } from "../../customer-item/helpers/customer-have-active-customer-items";
import { CustomerInvoiceActive } from "../../invoice/helpers/customer-invoice-active";
import { UserCanDeleteUserDetail } from "../helpers/user-can-delete-user-detail";
import { UserDeleteAllInfo } from "../helpers/user-delete-all-info";

export class UserDetailDeleteHook extends Hook {
  constructor(
    private orderActive?: OrderActive,
    private customerHaveActiveCustomerItems?: CustomerHaveActiveCustomerItems,
    private customerInvoiceActive?: CustomerInvoiceActive,
    private userCanDeleteUserDetail?: UserCanDeleteUserDetail,
    private userDeleteAllInfo?: UserDeleteAllInfo
  ) {
    super();
    this.orderActive = this.orderActive ? this.orderActive : new OrderActive();
    this.customerHaveActiveCustomerItems = this.customerHaveActiveCustomerItems
      ? this.customerHaveActiveCustomerItems
      : new CustomerHaveActiveCustomerItems();
    this.customerInvoiceActive = this.customerInvoiceActive
      ? this.customerInvoiceActive
      : new CustomerInvoiceActive();
    this.userCanDeleteUserDetail = this.userCanDeleteUserDetail
      ? this.userCanDeleteUserDetail
      : new UserCanDeleteUserDetail();
    this.userDeleteAllInfo = this.userDeleteAllInfo
      ? this.userDeleteAllInfo
      : new UserDeleteAllInfo();
  }

  public async before(
    body: any,
    accessToken: AccessToken,
    id: string
  ): Promise<boolean> {
    try {
      await this.checkIfUserCanDelete(id, accessToken);
      await this.checkActiveOrders(id);
      await this.checkActiveCustomerItems(id);
      await this.checkActiveInvoices(id);
      await this.userDeleteAllInfo.deleteAllInfo(id, accessToken);
    } catch (e) {
      throw new BlError(`user "${id}" could not be deleted: ${e.message}`);
    }

    return true;
  }

  private async checkIfUserCanDelete(
    id: string,
    accessToken: AccessToken
  ): Promise<boolean> {
    try {
      let canDelete = await this.userCanDeleteUserDetail.canDelete(
        id,
        accessToken
      );
      if (!canDelete) {
        throw new BlError(
          `user "${accessToken.details}" has no permission to delete user "${id}"`
        );
      }
    } catch (e) {
      throw e;
    }

    return true;
  }

  private async checkActiveInvoices(userId: string): Promise<boolean> {
    try {
      const haveActiveInvoices =
        await this.customerInvoiceActive.haveActiveInvoices(userId);
      if (haveActiveInvoices) {
        throw new BlError("customer have active invoices");
      }
      return false;
    } catch (e) {
      throw e;
    }
  }

  private async checkActiveCustomerItems(userId: string): Promise<boolean> {
    try {
      const haveActiveCustomerItems =
        await this.customerHaveActiveCustomerItems.haveActiveCustomerItems(
          userId
        );

      if (haveActiveCustomerItems) {
        throw new BlError("customer have active customer-items");
      }

      return false;
    } catch (e) {
      throw e;
    }
  }

  private async checkActiveOrders(userId: string): Promise<boolean> {
    try {
      const haveActiveOrders = await this.orderActive.haveActiveOrders(userId);
      if (haveActiveOrders) {
        throw new BlError("customer have active orders");
      }
      return false;
    } catch (e) {
      throw e;
    }
  }
}
