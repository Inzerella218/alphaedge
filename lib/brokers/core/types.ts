export type BrokerType = "ibkr" | "webull" | "paper";

export type BrokerConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type BrokerInstrumentType = "stock" | "etf" | "futures" | "option";

export type BrokerSymbol = {
  symbol: string;
  name: string;
  type: BrokerInstrumentType;
};

export type BrokerAccount = {
  id: string;
  broker: BrokerType;
  accountName: string;
  buyingPower?: number;
  netLiquidation?: number;
};

export type BrokerPosition = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketPrice?: number;
  unrealizedPnL?: number;
};

export type BrokerOrderSide = "buy" | "sell";
export type BrokerOrderType = "market" | "limit" | "stop";

export type PlaceOrderInput = {
  symbol: string;
  side: BrokerOrderSide;
  orderType: BrokerOrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
};

export type BrokerOrder = {
  id: string;
  symbol: string;
  side: BrokerOrderSide;
  orderType: BrokerOrderType;
  quantity: number;
  status: "pending" | "submitted" | "filled" | "cancelled" | "rejected";
};

export type BrokerConnectionResult = {
  success: boolean;
  status: BrokerConnectionStatus;
  message?: string;
};