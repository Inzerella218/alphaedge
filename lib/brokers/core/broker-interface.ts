import type {
  BrokerAccount,
  BrokerConnectionResult,
  BrokerConnectionStatus,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbol,
  BrokerType,
  PlaceOrderInput,
} from "./types";

export interface BrokerInterface {
  brokerType: BrokerType;

  getStatus(): BrokerConnectionStatus;

  connect(): Promise<BrokerConnectionResult>;

  disconnect(): Promise<BrokerConnectionResult>;

  getAccounts(): Promise<BrokerAccount[]>;

  getSymbols(query?: string): Promise<BrokerSymbol[]>;

  getPositions(): Promise<BrokerPosition[]>;

  getOrders(): Promise<BrokerOrder[]>;

  placeOrder(input: PlaceOrderInput): Promise<BrokerOrder>;

  cancelOrder(orderId: string): Promise<boolean>;
}