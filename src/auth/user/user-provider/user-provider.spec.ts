import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {UserHandler} from '../user.handler';
import {BlError, UserDetail} from '@wizardcoder/bl-model';
import {User} from '../../../collections/user/user';
import {UserProvider} from './user-provider';
import {LocalLoginHandler} from '../../local/local-login.handler';
import {TokenHandler} from '../../token/token.handler';
chai.use(chaiAsPromised);

describe('UserProvider', () => {
  const userHandler = new UserHandler();
  const tokenHandler = new TokenHandler(userHandler);
  const userGetStub = sinon.stub(userHandler, 'get');
  const userCreateStub = sinon.stub(userHandler, 'create');
  const userValidStub = sinon.stub(userHandler, 'valid');
  const localLoginHandler = new LocalLoginHandler();
  const createTokenStub = sinon.stub(tokenHandler, 'createTokens');

  const createDefaultLocalLoginStub = sinon.stub(
    localLoginHandler,
    'createDefaultLocalLoginIfNoneIsFound',
  );
  const userProvider = new UserProvider(
    userHandler,
    localLoginHandler,
    tokenHandler,
  );

  beforeEach(() => {
    userGetStub.reset();
    userCreateStub.reset();
    userValidStub.reset();
    createDefaultLocalLoginStub.reset();
    createTokenStub.reset();
  });

  describe('loginOrCreate()', () => {
    it('should reject if userHandler.valid rejects', () => {
      userGetStub.resolves({id: 'user1'});
      userValidStub.rejects(new BlError('user is not valid'));

      return expect(
        userProvider.loginOrCreate('username@mail.com', 'feide', 'abcdef'),
      ).to.eventually.be.rejectedWith(BlError, /user is not valid/);
    });

    it('should reject if localLoginHandler.createDefaultLocalLoginIfNoneIsFound rejects', () => {
      userGetStub.resolves({id: 'user1'});
      userValidStub.resolves(true);
      createDefaultLocalLoginStub.rejects(
        new BlError('local login could not be created'),
      );

      return expect(
        userProvider.loginOrCreate('username@mail.com', 'feide', 'abcde'),
      ).to.eventually.be.rejectedWith(
        BlError,
        /local login could not be created/,
      );
    });

    context('if user does not exist', () => {
      it('should reject if userHandler.create rejects', () => {
        userGetStub.rejects(new BlError('user not found'));
        userCreateStub.rejects(new BlError('user could not be created'));

        return expect(
          userProvider.loginOrCreate('username@mail.com', 'feide', 'abcde'),
        ).to.eventually.be.rejectedWith(BlError, /user could not be created/);
      });

      it('should resolve with a user object and tokens', () => {
        const user = {};
        userGetStub.rejects(new BlError('user not found'));
        userCreateStub.resolves(user);
        userValidStub.resolves(true);
        createDefaultLocalLoginStub.resolves(true);
        const tokens = {accessToken: 'atoken', refreshToken: 'rtoken'};
        createTokenStub.resolves(tokens);

        return expect(
          userProvider.loginOrCreate('username@mail.com', 'feide', 'abcdefg'),
        ).to.eventually.be.eql({user: user, tokens: tokens});
      });
    });

    context('if user does exist', () => {
      it('should resolve with a user object and tokens', () => {
        const user = {id: 'user1', username: 'user@mail.com'};
        userGetStub.resolves(user);
        userValidStub.resolves(true);
        createDefaultLocalLoginStub.resolves(true);

        const tokens = {accessToken: 'atoken', refreshToken: 'rtoken'};
        createTokenStub.resolves(tokens);

        return expect(
          userProvider.loginOrCreate('username@mail.com', 'feide', 'abcdefg'),
        ).to.eventually.be.eql({user: user, tokens: tokens});
      });
    });
  });
});