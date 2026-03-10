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

export class WebullBroker implements BrokerInterface {
  brokerType = "webull" as const;
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
      message: "Webull adapter connected (placeholder shell).",
    };
  }

  async disconnect(): Promise<BrokerConnectionResult> {
    this.status = "disconnected";

    return {
      success: true,
      status: this.status,
      message: "Webull adapter disconnected.",
    };
  }

  async getAccounts(): Promise<BrokerAccount[]> {
    return [
      {
        id: "webull-sim-001",
        broker: "webull",
        accountName: "Webull Placeholder Account",
        buyingPower: 25000,
        netLiquidation: 25000,
      },
    ];
  }

  async getSymbols(query?: string): Promise<BrokerSymbol[]> {
    const symbols: BrokerSymbol[] = [
      { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
      { symbol: "TSLA", name: "Tesla, Inc.", type: "stock" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
      { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "stock" },
      { symbol: "META", name: "Meta Platforms, Inc.", type: "stock" },
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
        symbol: "TSLA",
        quantity: 3,
        averagePrice: 248.5,
        marketPrice: 250.2,
        unrealizedPnL: 510,
      },
    ];
  }

  async getOrders(): Promise<BrokerOrder[]> {
    return [];
  }

  async placeOrder(input: PlaceOrderInput): Promise<BrokerOrder> {
    return {
      id: `webull-order-${Date.now()}`,
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