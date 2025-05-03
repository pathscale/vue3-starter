export const getSymbolExternalUrl = (symbol: string) => {
  return `https://www.gate.io/trade/${symbol}`;
};

export const getSourceExternalUrl = (source: string) => {
  switch (source) {
    case "gateio":
      return "https://www.gate.io";
    default:
      return source;
  }
};

export const getTransactionUrl = (transactionHash: string) => {
  return `https://etherscan.io/tx/${transactionHash}`;
};
