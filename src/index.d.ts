declare module 'lyzr-agent' {
  type LyzrUrlOverrides = {
    pagosUrl?: string;
    agentStudioUrl?: string;
    agentStudioUrlSignup?: string;
  };

  class LyzrAgent {
    init(publicKey: string, urlOverrides?: LyzrUrlOverrides): Promise<LyzrAgent>;
    setUrlOverrides(urlOverrides: LyzrUrlOverrides): void;
    setBadgePosition(x?: string, y?: string): void;
    getKeys(urlOverrides?: LyzrUrlOverrides): Promise<any>;
    getKeysUser(urlOverrides?: LyzrUrlOverrides): Promise<any>;
    hideAppContent(): void;
    showAppContent(): void;
    logout(): void;
    onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void;
    checkCredits(urlOverrides?: LyzrUrlOverrides): Promise<void>;
  }

  const lyzr: LyzrAgent;
  export default lyzr;
}
