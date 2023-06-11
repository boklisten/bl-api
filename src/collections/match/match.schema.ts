import { Schema } from "mongoose";
import { BlCollectionName } from "../bl-collection";
import {
  // used for jsdoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MatchBase,
  // used for jsdoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  StandMatch,
  // used for jsdoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UserMatch,
  // used for jsdoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Match,
  // used for jsdoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MatchVariant,
} from "@boklisten/bl-model";

const { ObjectId, String, Date } = Schema.Types;

/** @see MatchBase */
const matchBaseSchema = {
  /** @see MatchVariant */
  _variant: {
    type: String,
    required: true,
  },
  meetingInfo: {
    location: { type: String, required: true },
    // Can be null in case of a StandMatch
    date: Date,
  },
};

/** @see UserMatch */
const userMatchSchema = {
  sender: {
    type: ObjectId,
    ref: BlCollectionName.UserDetails,
    default: undefined,
  },
  receiver: {
    type: ObjectId,
    ref: BlCollectionName.UserDetails,
    default: undefined,
  },
  // items which are expected to be handed over from sender to receiver
  expectedItems: {
    type: [ObjectId],
    ref: BlCollectionName.Items,
    default: undefined,
  },
  // customerItems owned by sender which have been given to anyone. May differ from receivedCustomerItems
  // when a book is borrowed and handed over to someone other than the technical owner's match
  deliveredCustomerItems: {
    type: [ObjectId],
    ref: BlCollectionName.CustomerItems,
    default: undefined,
  },
  // items which have been received by the receiver from anyone
  receivedCustomerItems: {
    type: [ObjectId],
    ref: BlCollectionName.CustomerItems,
    default: undefined,
  },
};

/** @see StandMatch */
const standMatchSchema = {
  customer: {
    type: ObjectId,
    ref: BlCollectionName.UserDetails,
    default: undefined,
  },
  // items the customer has received from stand
  receivedItems: {
    type: [ObjectId],
    ref: BlCollectionName.Items,
    default: undefined,
  },
  // items the customer has handed off to stand
  deliveredItems: {
    type: [ObjectId],
    ref: BlCollectionName.Items,
    default: undefined,
  },
  // items which are expected to be handed off to stand
  expectedHandoffItems: {
    type: [ObjectId],
    ref: BlCollectionName.Items,
    default: undefined,
  },
  // items which are expected to be picked up from stand
  expectedPickupItems: {
    type: [ObjectId],
    ref: BlCollectionName.Items,
    default: undefined,
  },
};

/**
 * The schema for {@link Match}.
 *
 * Variants implemented using the union of all possible keys, with those present only in some variants optional and
 * default undefined. No key name may be used with different definitions in multiple variants.
 */
export const matchSchema = {
  ...matchBaseSchema,
  ...standMatchSchema,
  ...userMatchSchema,
};
