declare module 'lyzr-agent' {
  interface LyzrAgent {
    init(publicKey: string): Promise<LyzrAgent>;
    setBadgePosition(x?: string, y?: string): void;
    getKeys(): Promise<string[]>;
    hideAppContent(): void;
    showAppContent(): void;
  }

  const lyzr: LyzrAgent;
  export default lyzr;
}
