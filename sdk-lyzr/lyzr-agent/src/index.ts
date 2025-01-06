import memberstackDom from '@memberstack/dom';

class LyzrAgent {
  private memberstack: any;
  private badge: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private isAuthenticated = false;
  public token: string | null = null;
  private authStateCallbacks: ((isAuthenticated: boolean) => void)[] = [];
  private badgePosition = {
    x: 'right: 20px',
    y: 'bottom: 20px'
  };

  constructor(publicKey: string) {
    console.log('Initializing LyzrAgent');
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    // Initialize Memberstack correctly
    this.memberstack = memberstackDom.init({
      publicKey,
      sessionDurationDays: 30
    });
  }

  public async init(publicKey: string): Promise<LyzrAgent> {
    try {
      console.log('Starting initialization');
      // Create elements first
      this.createLoginModal();
      this.createBadge();

      // Hide the app content initially
      console.log('Hiding app content');
      this.hideAppContent();

      // Check auth status and show/hide content accordingly
      console.log('Checking auth status');
      await this.checkAuthStatus();

      // Set up auth state listener
      this.setupAuthStateListener();

      console.log('Initialization complete');
      return this;
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  private setupAuthStateListener() {
    // Check auth state periodically
    setInterval(async () => {
      const member = await this.memberstack.getMemberCookie();
      const newAuthState = !!member;
      if (newAuthState !== this.isAuthenticated) {
        this.isAuthenticated = newAuthState;
        this.token = member;
        this.notifyAuthStateChange();
      }
    }, 1000); // Check every second
  }

  private notifyAuthStateChange() {
    this.authStateCallbacks.forEach(callback => {
      callback(this.isAuthenticated);
    });
  }

  public onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    this.authStateCallbacks.push(callback);
    // Immediately call with current state
    callback(this.isAuthenticated);
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  public async getKeys(): Promise<any> {
    try {
      if (!this.token) {
        console.error('No authentication token available');
        return null;
      }

      const response = await fetch('https://pagos-prod.studio.lyzr.ai/api/v1/keys/', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching keys:', error);
      return null;
    }
  }
  public async logout() {
    await this.memberstack.logout()
  }

  private hideAppContent() {
    console.log('Hiding app content');
    const appContent = document.getElementById('root');
    if (appContent) {
      appContent.style.display = 'none';
    }
  }

  private showAppContent() {
    console.log('Showing app content');
    const appContent = document.getElementById('root');
    if (appContent) {
      appContent.style.display = 'block';
    }
  }

  private async checkAuthStatus() {
    try {
      const member = await this.memberstack.getMemberCookie();
      this.token = member;
      const newAuthState = !!member;
      if (this.isAuthenticated !== newAuthState) {
        this.isAuthenticated = newAuthState;
        this.notifyAuthStateChange();
      }
      if (member) {
        this.showAppContent();
        this.hideLoginModal();
      } else {
        this.hideAppContent();
        this.showLoginModal();
      }
      console.log('Auth status checked:', { member, isAuthenticated: this.isAuthenticated });
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
      this.notifyAuthStateChange();
      this.showLoginModal();
      this.hideAppContent();
    }
  }

  private createLoginModal() {
    console.log('Creating login modal');
    // Remove any existing modal first
    const existingModal = document.getElementById('lyzr-login-modal-container');
    if (existingModal) {
      console.log('Removing existing modal');
      existingModal.remove();
    }

    const modalHtml = `
      <div id="lyzr-login-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          width: 400px;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <img src="https://studio.lyzr.ai/images/Lyzr-Logo.svg" alt="Lyzr Logo" style="
            height: 40px;
            margin-bottom: 24px;
          ">
          <h2 style="
            margin: 0 0 12px;
            color: #333;
            font-size: 24px;
            font-weight: 600;
          ">Sign in with Lyzr Agents Platform</h2>
          <p style="
            margin: 0 0 32px;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
          ">Connect with your Google account to get started</p>
          <button id="lyzr-google-login" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 12px 24px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: white;
            color: #333;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    `;
    const modalElement = document.createElement('div');
    modalElement.id = 'lyzr-login-modal-container';
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement);
    console.log('Modal element created:', modalElement);

    // Get the modal element and store reference
    const modal = document.getElementById('lyzr-login-modal');
    if (!modal) {
      console.error('Failed to find modal element after creation');
      return;
    }
    this.modal = modal;
    console.log('Modal reference set:', this.modal);

    // Add Google login button click handler
    const googleButton = document.getElementById('lyzr-google-login');
    if (googleButton) {
      googleButton.addEventListener('click', () => this.handleGoogleLogin());
    } else {
      console.error('Failed to find Google login button');
    }
  }

  private async handleGoogleLogin() {
    try {
      await this.memberstack.loginWithProvider({
        provider: "google"
      });
      await this.checkAuthStatus();
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  }

  private createBadge() {
    const badgeHtml = `
      <div id="lyzr-badge" style="
        position: fixed;
        ${this.badgePosition.x};
        ${this.badgePosition.y};
        background: white;
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        cursor: default;
      ">
        <span>Powered by Lyzr Agent Studio</span>
        <img src="https://studio.lyzr.ai/images/Lyzr-Logo.svg" alt="Lyzr Logo" style="height: 20px; width: auto;">
        <div style="position: relative;">
          <button id="lyzr-settings-button" style="
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            opacity: 0.7;
            transition: opacity 0.2s;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 20.91 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div id="lyzr-settings-menu" style="
            display: none;
            position: absolute;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 8px 0;
            min-width: 160px;
            z-index: 1001;
            right: 0;
          ">
            <button id="lyzr-logout-button" style="
              width: 100%;
              padding: 8px 16px;
              border: none;
              background: none;
              text-align: left;
              font-family: inherit;
              font-size: 14px;
              color: #333;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: background-color 0.2s;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    `;
    const badgeElement = document.createElement('div');
    badgeElement.innerHTML = badgeHtml;
    document.body.appendChild(badgeElement);
    this.badge = badgeElement.firstElementChild as HTMLElement;

    // Add click handlers
    if (this.badge) {
      const settingsButton = document.getElementById('lyzr-settings-button');
      const settingsMenu = document.getElementById('lyzr-settings-menu');
      const logoutButton = document.getElementById('lyzr-logout-button');

      if (settingsButton && settingsMenu && logoutButton) {
        // Add hover effect for settings button
        settingsButton.addEventListener('mouseover', () => {
          settingsButton.style.opacity = '1';
        });
        settingsButton.addEventListener('mouseout', () => {
          settingsButton.style.opacity = '0.7';
        });

        // Add hover effect for logout button
        logoutButton.addEventListener('mouseover', () => {
          logoutButton.style.backgroundColor = '#f5f5f5';
        });
        logoutButton.addEventListener('mouseout', () => {
          logoutButton.style.backgroundColor = 'transparent';
        });

        // Settings button click handler
        settingsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const isBottom = this.badgePosition.y.includes('bottom');

          // Position menu above or below based on badge position
          if (isBottom) {
            settingsMenu.style.bottom = '100%';
            settingsMenu.style.top = 'auto';
            settingsMenu.style.marginBottom = '8px';
          } else {
            settingsMenu.style.top = '100%';
            settingsMenu.style.bottom = 'auto';
            settingsMenu.style.marginTop = '8px';
          }

          // Toggle menu visibility
          settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        });

        // Logout button click handler
        logoutButton.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await this.memberstack.logout();
            window.location.reload();
          } catch (error) {
            console.error('Logout error:', error);
          }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
          const target = e.target as Node;
          if (!settingsMenu.contains(target) && !settingsButton.contains(target)) {
            settingsMenu.style.display = 'none';
          }
        });
      }
    }
  }

  setBadgePosition(x?: string, y?: string) {
    console.warn(this.isAuthenticated);
    if (!this.isAuthenticated) {
      console.warn('User must be authenticated to modify badge position');
      return;
    }

    if (x) this.badgePosition.x = `right: ${x}`;
    if (y) this.badgePosition.y = `bottom: ${y}`;

    if (this.badge) {
      this.badge.style.right = x || '20px';
      this.badge.style.bottom = y || '20px';
    }
  }

  private showLoginModal() {
    console.log('Showing login modal');
    if (!this.modal) {
      console.warn('Modal not found, creating new one');
      this.createLoginModal();
    }

    if (this.modal) {
      console.log('Setting modal display to block');
      requestAnimationFrame(() => {
        if (this.modal) {
          this.modal.style.display = 'block';
          console.log('Modal display style after update:', this.modal.style.display);
          // Force a reflow
          this.modal.offsetHeight;
        }
      });
    } else {
      console.error('Failed to show modal');
    }
  }

  private hideLoginModal() {
    console.log('Hiding login modal');
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }
}

// Create and export a single instance
const lyzrInstance = new LyzrAgent('pk_c14a2728e715d9ea67bf');

// Explicitly set as global
if (typeof window !== 'undefined') {
  (window as any).lyzr = lyzrInstance;
}

export default lyzrInstance;
