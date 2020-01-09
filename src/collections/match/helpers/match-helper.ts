import {
  OrderItem,
  MatchItem,
  UserDetail,
  MatchProfile,
} from '@wizardcoder/bl-model';

export class MatchHelper {
  public convertOrderItemsToMatchItems(orderItems: OrderItem[]): MatchItem[] {
    return orderItems.map(orderItem => {
      return {
        item: orderItem.item as string,
        customerItem: orderItem.customerItem as string,
        title: orderItem.title,
      };
    });
  }

  public convertUserDetailToMatchProfile(userDetail: UserDetail): MatchProfile {
    return {
      userId: userDetail.id,
      name: userDetail.name,
      email: userDetail.email,
      phone: userDetail.phone,
    };
  }
}
