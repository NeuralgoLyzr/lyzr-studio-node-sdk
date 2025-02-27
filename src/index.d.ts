declare module 'lyzr-agent' {
  class LyzrAgent {
    init(publicKey: string): Promise<LyzrAgent>;
    setBadgePosition(x?: string, y?: string): void;
    getKeys(): Promise<string[]>;
    getKeysUser(): Promise<any>;
    hideAppContent(): void;
    showAppContent(): void;
    logout(): void;
    onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void;
    checkCredits(): Promise<void>;
  }

  const lyzr: LyzrAgent;
  export default lyzr;
}
