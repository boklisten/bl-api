import {Hook} from '../../../hook/hook';
import {AccessToken, Message, BlError, UserDetail} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from 'util';
import {MessengerReminder} from '../../../messenger/reminder/messenger-reminder';
import {PermissionService} from '../../../auth/permission/permission.service';
import {BlDocumentStorage} from '../../../storage/blDocumentStorage';
import {messageSchema} from '../message.schema';
import {MessageHelper} from '../helper/message-helper';
import {logger} from '../../../logger/logger';
import {Messenger} from '../../../messenger/messenger';
import {userDetailSchema} from '../../user-detail/user-detail.schema';

export class MessagePostHook implements Hook {
  private messengerReminder: MessengerReminder;
  private messageStorage: BlDocumentStorage<Message>;
  private permissionService: PermissionService;
  private messageHelper: MessageHelper;
  private messenger: Messenger;
  private userDetailStorage: BlDocumentStorage<UserDetail>;

  constructor(
    messengerReminder?: MessengerReminder,
    messageStorage?: BlDocumentStorage<Message>,
    messageHelper?: MessageHelper,
    messenger?: Messenger,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
  ) {
    this.messengerReminder = messengerReminder
      ? messengerReminder
      : new MessengerReminder();
    this.messageStorage = messageStorage
      ? messageStorage
      : new BlDocumentStorage('messages', messageSchema);
    this.permissionService = new PermissionService();
    this.messageHelper = messageHelper
      ? messageHelper
      : new MessageHelper(this.messageStorage);
    this.messenger = messenger ? messenger : new Messenger();
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage('userdetails', userDetailSchema);
  }

  async before(
    message: Message,
    accessToken: AccessToken,
    id?: string,
  ): Promise<boolean> {
    if (typeof message.messageType === 'undefined' || !message.messageType) {
      throw new BlError('messageType is not defined').code(701);
    }

    if (
      typeof message.messageSubtype === 'undefined' ||
      !message.messageSubtype
    ) {
      throw new BlError('messageSubtype is not defined').code(701);
    }

    if (message.messageType === 'reminder') {
      if (
        !this.permissionService.isPermissionEqualOrOver(
          accessToken.permission,
          'admin',
        )
      ) {
        throw new BlError('no permission').code(904);
      }
    }

    let alreadyAdded;

    try {
      alreadyAdded = await this.messageHelper.isAdded(message);
    } catch (e) {
      throw new BlError('could not check if message was already added');
    }

    if (alreadyAdded) {
      throw new BlError(
        `message is already added: type: ${message.messageType}, subtype: ${
          message.messageSubtype
        }, seq: ${message.sequenceNumber}, customer: "${message.customerId}"`,
      ).code(701);
    }

    return true;
  }

  async after(
    messages: Message[],
    accessToken: AccessToken,
  ): Promise<Message[]> {
    if (isNullOrUndefined(messages) || messages.length <= 0) {
      throw new BlError('no messages provided');
    }

    const message = messages[0];

    switch (message.messageType) {
      case 'reminder':
        return await this.onRemind(message);
      case 'generic':
        return await this.onGeneric(message);
      default:
        throw new BlError(
          `MessageType "${message.messageType}" is not supported`,
        );
    }
  }

  private async onGeneric(message: Message): Promise<Message[]> {
    let userDetail: UserDetail;
    try {
      userDetail = await this.userDetailStorage.get(message.customerId);
      await this.messenger.send(message, userDetail);
      return [message];
    } catch (e) {
      throw `could not send generic message: ${e}`;
    }
  }

  private async onRemind(message: Message): Promise<Message[]> {
    try {
      await this.messengerReminder.remindCustomer(message);
      return [message];
    } catch (e) {
      throw e;
    }
  }
}
