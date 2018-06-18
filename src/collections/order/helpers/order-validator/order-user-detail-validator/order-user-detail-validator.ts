import {BlError, Order, UserDetail} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../../../user-detail/user-detail.schema";


export class OrderUserDetailValidator {

	private _userDetailStorage: BlDocumentStorage<UserDetail>;

	constructor(userDetailStorage?: BlDocumentStorage<UserDetail>) {
		this._userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
	}

	public validate(order: Order): Promise<boolean> {
		return this._userDetailStorage.get(order.customer).then((userDetail: UserDetail) => {

			if (!userDetail.emailConfirmed) {
				throw new BlError('userDetail.emailConfirmed is not true');
			}

			return true;
		}).catch((userDetailValidateError: BlError) => {
			throw new BlError('userDetail could not be validated').add(userDetailValidateError);
		})
	}
}