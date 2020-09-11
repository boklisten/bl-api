import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlapiResponse, BlError, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from '../../../../storage/blDocumentStorage';
import {SEResponseHandler} from '../../../../response/se.response.handler';
import {Response} from 'express';
import {BlApiRequest} from '../../../../request/bl-api-request';
chai.use(chaiAsPromised);
import {UserDetailPermissionOperation} from './user-detail-permission.operation';
import {User} from '../../../user/user';

describe('UserDetailPermissionOperation', () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>('userdetails');
  const userStorage = new BlDocumentStorage<User>('users');
  const resHandler = new SEResponseHandler();
  const userDetailPermissionOperation = new UserDetailPermissionOperation(
    userDetailStorage,
    userStorage,
    resHandler,
  );

  const userAggregateStub = sinon.stub(userStorage, 'aggregate');
  const userDetailGetStub = sinon.stub(userDetailStorage, 'get');
  const userUpdateStub = sinon.stub(userStorage, 'update');
  const resHandlerStub = sinon.stub(resHandler, 'sendResponse');

  beforeEach(() => {
    userAggregateStub.reset();
    userDetailGetStub.reset();
    userUpdateStub.reset();
    resHandlerStub.reset();
  });

  it('should reject if userDetail is not found', () => {
    userDetailGetStub.rejects(new BlError('user-detail not found'));

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail2', permission: 'admin'},
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.rejectedWith(BlError, /user-detail not found/);
  });

  it('should reject if user is not found', () => {
    userDetailGetStub.resolves({
      id: 'userDetail1',
      blid: 'abcdef',
      email: 'abcdef',
    });
    userAggregateStub.rejects(new BlError('user not found'));

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail2', permission: 'admin'},
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.rejectedWith(BlError, /user not found/);
  });

  const permissions: any[] = ['customer', 'employee', 'manager', 'admin'];

  for (let permission of permissions) {
    it(`should reject if blApiRequest.user.permission "${permission}" is lower than user.permission "admin"`, () => {
      userDetailGetStub.resolves({
        id: 'userDetail1',
        blid: 'abcdef',
        email: 'abcdef',
      });
      userAggregateStub.resolves([{permission: 'admin'}]);

      return expect(
        userDetailPermissionOperation.run({
          user: {id: 'userDetail2', permission: permission},
          documentId: 'userDetail1',
          data: {permission: 'employee'},
        }),
      ).to.eventually.be.rejectedWith(
        BlError,
        'no access to change permission',
      );
    });
  }

  it(`should reject if blApiRequest.user.permission is not "admin" or higher`, () => {
    userDetailGetStub.resolves({
      id: 'userDetail1',
      blid: 'abcdef',
      email: 'abcdef',
    });
    userAggregateStub.resolves([{permission: 'employee'}]);

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail2', permission: 'manager'},
        documentId: 'userDetail1',
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.rejectedWith(BlError, 'no access to change permission');
  });

  it('should reject if trying to change users own permission', () => {
    userDetailGetStub.resolves({
      id: 'userDetail1',
      blid: 'abcdef',
      email: 'abcdef',
    });
    userAggregateStub.resolves([{permission: 'employee'}]);

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail1', permission: 'manager'},
        documentId: 'userDetail1',
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.rejectedWith(
      BlError,
      'user can not change own permission',
    );
  });

  it('should reject if blApiRequest.data.permission is not a valid permission', () => {
    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail1', permission: 'admin'},
        documentId: 'userDetail2',
        data: {},
      }),
    ).to.eventually.be.rejectedWith(
      BlError,
      'permission is not valid or not provided',
    );
  });

  it('should reject if userStorage.update rejects', () => {
    userDetailGetStub.resolves({
      id: 'userDetail1',
      blid: 'abcdef',
      email: 'abcdef',
    });
    userAggregateStub.resolves([{permission: 'customer'}]);
    userUpdateStub.rejects(new BlError('could not update permission'));

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail1', permission: 'admin'},
        documentId: 'userDetail2',
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.rejectedWith(BlError, 'could not update permission');
  });

  it('should resolve', () => {
    userDetailGetStub.resolves({
      id: 'userDetail1',
      blid: 'abcdef',
      email: 'abcdef',
    });
    userAggregateStub.resolves([{permission: 'customer'}]);
    userUpdateStub.resolves(true);
    resHandlerStub.resolves(true);

    return expect(
      userDetailPermissionOperation.run({
        user: {id: 'userDetail1', permission: 'admin'},
        documentId: 'userDetail2',
        data: {permission: 'employee'},
      }),
    ).to.eventually.be.true;
  });
});
