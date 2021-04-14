import { CustomerItem } from "@boklisten/bl-model";

export class CustomerItemActive {
  public isActive(customerItem: CustomerItem): boolean {
    if (
      customerItem.returned ||
      customerItem.buyout ||
      customerItem.cancel ||
      customerItem.buyback
    ) {
      return false;
    }

    return true;
  }
}
