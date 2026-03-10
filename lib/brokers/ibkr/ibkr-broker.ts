import type { BrokerInterface } from "../core/broker-interface";
import type {
  BrokerAccount,
  BrokerConnectionResult,
  BrokerConnectionStatus,
  BrokerOrder,
  BrokerPosition,
  BrokerSymbol,
  PlaceOrderInput,
} from "../core/types";

export class IbkrBroker implements BrokerInterface {
  brokerType = "ibkr" as const;
  private status: BrokerConnectionStatus = "disconnected";

  getStatus(): BrokerConnectionStatus {
    return this.status;
  }

  async connect(): Promise<BrokerConnectionResult> {
    this.status = "connecting";

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.status = "connected";

    return {
      success: true,
      status: this.status,
      message: "IBKR adapter connected (mock shell).",
    };
  }

  async disconnect(): Promise<BrokerConnectionResult> {
    this.status = "disconnected";

    return {
      success: true,
      status: this.status,
      message: "IBKR adapter disconnected.",
    };
  }

  async getAccounts(): Promise<BrokerAccount[]> {
    return [
      {
        id: "ibkr-sim-001",
        broker: "ibkr",
        accountName: "IBKR Paper Account",
        buyingPower: 100000,
        netLiquidation: 100000,
      },
    ];
  }

  async getSymbols(query?: string): Promise<BrokerSymbol[]> {
    const symbols: BrokerSymbol[] = [
      { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "etf" },
      { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf" },
      { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
      { symbol: "TSLA", name: "Tesla, Inc.", type: "stock" },
      { symbol: "ES", name: "E-mini S&P 500 Futures", type: "futures" },
      { symbol: "NQ", name: "E-mini Nasdaq-100 Futures", type: "futures" },
    ];

    if (!query) return symbols;

    const q = query.toLowerCase();

    return symbols.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }

  async getPositions(): Promise<BrokerPosition[]> {
    return [
      {
        symbol: "SPY",
        quantity: 2,
        averagePrice: 512.25,
        marketPrice: 513.1,
        unrealizedPnL: 170,
      },
      {
        symbol: "NVDA",
        quantity: 1,
        averagePrice: 118.4,
        marketPrice: 119.05,
        unrealizedPnL: 65,
      },
    ];
  }

  async getOrders(): Promise<BrokerOrder[]> {
    return [];
  }

  async placeOrder(input: PlaceOrderInput): Promise<BrokerOrder> {
    return {
      id: `ibkr-order-${Date.now()}`,
      symbol: input.symbol,
      side: input.side,
      orderType: input.orderType,
      quantity: input.quantity,
      status: "submitted",
    };
  }

  async cancelOrder(_orderId: string): Promise<boolean> {
    return true;
  }
}