import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, CustomerItem} from '@wizardcoder/bl-model';

chai.use(chaiAsPromised);

describe('CustomerItemPatchHook', () => {
	let testCustomerItem: CustomerItem;

});