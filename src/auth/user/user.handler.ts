import { SEDbQuery } from "../../query/se.db-query";

import { Blid } from "../blid/blid";
import { UserDetail, BlError } from "@boklisten/bl-model";
import { User } from "../../collections/user/user";
import { UserSchema } from "../../collections/user/user.schema";
import { userDetailSchema } from "../../collections/user-detail/user-detail.schema";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { PasswordReset } from "../../collections/password-reset/password-reset";
import { EmailValidationHelper } from "../../collections/email-validation/helpers/email-validation.helper";
import { SystemUser } from "../permission/permission.service";
import { LocalLoginHandler } from "../local/local-login.handler";
import { LocalLoginValidator } from "../local/local-login.validator";
import { LocalLogin } from "../../collections/local-login/local-login";

export class UserHandler {
  private blid: Blid;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private userStorage: BlDocumentStorage<User>;
  private _emailValidationHelper: EmailValidationHelper;
  private _localLoginHandler: LocalLoginHandler;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    userStorage?: BlDocumentStorage<User>,
    emailValidationHelper?: EmailValidationHelper,
    localLoginHandler?: LocalLoginHandler
  ) {
    this.blid = new Blid();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
    this._emailValidationHelper = emailValidationHelper
      ? emailValidationHelper
      : new EmailValidationHelper();
    this.userStorage = userStorage
      ? userStorage
      : new BlDocumentStorage("users", UserSchema);
    this._localLoginHandler = localLoginHandler
      ? localLoginHandler
      : new LocalLoginHandler();
  }

  public getByUsername(username: string): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!username)
        return reject(new BlError("username is empty or undefined"));

      let dbQuery = new SEDbQuery();
      dbQuery.stringFilters = [{ fieldName: "username", value: username }];

      this.userStorage.getByQuery(dbQuery).then(
        (docs: User[]) => {
          if (docs.length > 1) {
            this.handleIfMultipleUsersWithSameEmail(docs)
              .then((user: User) => {
                resolve(user);
              })
              .catch(() => {
                reject(
                  new BlError(`could not handle user with multiple entries`)
                );
              });
          } else {
            resolve(docs[0]);
          }
        },
        (error: BlError) => {
          reject(
            new BlError('could not find user with username "' + username + '"')
              .add(error)
              .code(702)
          );
        }
      );
    });
  }

  private handleIfMultipleUsersWithSameEmail(users: User[]): Promise<User> {
    // this bit of code is for some of our very first customers that had more than one user
    // this issue came from multiple logins as it was created a new user for Facbook, Google and local
    // even with the same email

    let selectedUser = null;

    for (let user of users) {
      if (user.primary) {
        selectedUser = user;
      }
    }

    if (selectedUser) {
      return Promise.resolve(selectedUser);
    } else {
      selectedUser = users[0];

      return this.userStorage
        .update(selectedUser, { primary: true }, new SystemUser())
        .then((primaryUser) => {
          let promiseArr: Promise<User>[] = [];

          for (let i = 1; i < users.length; i++) {
            promiseArr.push(
              this.userStorage.update(
                users[i].id,
                { movedToPrimary: selectedUser.id },
                new SystemUser()
              )
            );
          }

          return Promise.all(promiseArr)
            .then(() => {
              return selectedUser;
            })
            .catch(() => {
              throw new BlError(
                `user with multiple entries could not update the other entries with invalid`
              );
            });
        })
        .catch((updateUserErr) => {
          throw new BlError(
            "user with multiple entries could not update one to primary"
          );
        });
    }
  }

  public get(provider: string, providerId: string): Promise<User> {
    let blError = new BlError("").className("userHandler").methodName("exists");

    return new Promise((resolve, reject) => {
      if (!provider || provider.length <= 0)
        reject(blError.msg("provider is empty or undefined"));
      if (!providerId || providerId.length <= 0)
        reject(blError.msg("providerId is empty of undefined"));

      let dbQuery = new SEDbQuery();
      dbQuery.stringFilters = [
        { fieldName: "login.provider", value: provider },
        { fieldName: "login.providerId", value: providerId },
      ];

      this.userStorage
        .getByQuery(dbQuery)
        .then((users: User[]) => {
          resolve(users[0]);
        })
        .catch((error: BlError) => {
          reject(
            new BlError("an error occured when getting user")
              .store("provider", provider)
              .store("providerId", providerId)
              .add(error)
          );
        });
    });
  }

  public async create(
    username: string,
    provider: string,
    providerId: string
  ): Promise<User> {
    if (!username || username.length <= 0)
      throw new BlError("username is empty or undefined").code(907);
    if (!provider || provider.length <= 0)
      throw new BlError("provider is empty or undefined").code(907);
    if (!providerId || providerId.length <= 0)
      throw new BlError("providerId is empty or undefined").code(907);

    let userExists: User = null;
    try {
      userExists = await this.getByUsername(username);
    } catch (e) {
      userExists = null;
    }

    if (userExists) {
      if (provider === "local") {
        throw new BlError(
          `username "${username}" already exists, but trying to create new user with provider "local"`
        ).code(903);
      } else if (this.isThirdPartyProvider(provider)) {
        // if user already exists and the creation is with google or facebook
        try {
          const localLogin = await this._localLoginHandler.get(username);
        } catch (e) {
          // if localLogin is not found, should create a default one
          await this._localLoginHandler.createDefaultLocalLogin(username);
        }

        return userExists;
      } else {
        throw new BlError(
          `username "${username}" already exists, but could not link it with new provider "${provider}"`
        );
      }
    }

    try {
      const blid = await this.blid.createUserBlid(provider, providerId);
      let userDetail: any = {
        email: username,
        blid: blid,
        emailConfirmed: this.isThirdPartyProvider(provider), // email is only valid on creation if using Google or Facebook
      };

      if (this.isThirdPartyProvider(provider)) {
        // if the provider is google or facebook, should create a default localLogin
        // this so that when the user tries to login with username or password he can
        // ask for a new password via email

        await this._localLoginHandler.createDefaultLocalLogin(username);
      }

      const addedUserDetail: UserDetail = await this.userDetailStorage.add(
        userDetail,
        { id: blid, permission: "customer" }
      );

      if (!addedUserDetail.emailConfirmed) {
        await this.sendEmailValidationLink(addedUserDetail);
      }

      let newUser: any = {
        userDetail: addedUserDetail.id,
        permission: "customer",
        blid: blid,
        username: username,
        valid: false,
        login: {
          provider: provider,
          providerId: providerId,
        },
      };

      return await this.userStorage.add(newUser, {
        id: blid,
        permission: newUser.permission,
      });
    } catch (e) {
      let blError = new BlError("user creation failed").code(903);

      if (e instanceof BlError) {
        blError.add(e);
      } else {
        blError.store("UserCreationError", e);
      }

      throw blError;
    }
  }

  private isThirdPartyProvider(provider: string): boolean {
    return (
      provider === "google" || provider === "facebook" || provider === "oauth2"
    );
  }

  private sendEmailValidationLink(userDetail: UserDetail): Promise<boolean> {
    return this._emailValidationHelper
      .createAndSendEmailValidationLink(userDetail.id)
      .then(() => {
        return true;
      })
      .catch((sendEmailValidationLinkError: BlError) => {
        throw new BlError("could not send out email validation link").add(
          sendEmailValidationLinkError
        );
      });
  }

  public valid(username: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getByUsername(username)
        .then((user: User) => {
          if (!user.active) {
            return reject(new BlError("user.active is false").code(913));
          }

          resolve(true);
        })
        .catch((getUserError: BlError) => {
          reject(getUserError);
        });
    });
  }

  public exists(provider: string, providerId: string): Promise<boolean> {
    if (!provider || !providerId) {
      return Promise.reject(
        new BlError("provider or providerId is empty or undefinedl")
      );
    }

    let dbQuery = new SEDbQuery();
    dbQuery.stringFilters = [
      { fieldName: "login.provider", value: provider },
      { fieldName: "login.providerId", value: providerId },
    ];

    return new Promise((resolve, reject) => {
      this.userStorage
        .getByQuery(dbQuery)
        .then((users: User[]) => {
          resolve(true);
        })
        .catch((blError: BlError) => {
          reject(new BlError("does not exist").add(blError));
        });
    });
  }
}
