import type { BrokerInterface } from "./core/broker-interface";
import type { BrokerType } from "./core/types";
import { IbkrBroker } from "./ibkr/ibkr-broker";
import { WebullBroker } from "./webull/webull-broker";

export function createBroker(type: BrokerType): BrokerInterface {
  switch (type) {
    case "ibkr":
      return new IbkrBroker();

    case "webull":
      return new WebullBroker();

    case "paper":
      return new IbkrBroker();

    default:
      return new IbkrBroker();
  }
}