declare module 'lyzr-agent' {
  class LyzrAgent {
    init(publicKey: string): Promise<LyzrAgent>;
    setBadgePosition(x?: string, y?: string): void;
    getKeys(): Promise<string[]>;
    hideAppContent(): void;
    showAppContent(): void;
    logout(): void;
    onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void;
  }

  const lyzr: LyzrAgent;
  export default lyzr;
}
