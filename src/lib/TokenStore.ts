import { Authenticator } from './Authenticator';
import { TokenPair } from './interfaces/TokenStore';
import { Logger } from './Logger';

export class TokenStore {
  static readonly TOKEN_KEY = 'tokens';
  static readonly TOKEN_EXP_LENGTH = 3600000; // 1 hour in milliseconds

  private memoryStorage = {};

  saveTokens(tokens: TokenPair): void {
    tokens.storedAt = Date.now();

    this.memoryStorage[TokenStore.TOKEN_KEY] = tokens;
  }

  async getTokens(): Promise<TokenPair> {
    const tokens = this.memoryStorage[TokenStore.TOKEN_KEY];

    if (!this.isExpired()) {
      return tokens;
    }

    Logger.debug('Auth tokens are expired, refreshing...');

    try {
      const authenticator = new Authenticator(this);
      const newTokens = await authenticator.refreshTokens(tokens);

      this.saveTokens(newTokens);

      Logger.debug('Token refresh succeeded');

      return newTokens;
    } catch(e) {
      Logger.error('Unable to refresh tokens', e);
    }
  }

  isExpired(): boolean {
    const tokens: TokenPair = this.memoryStorage[TokenStore.TOKEN_KEY];

    return (Date.now() - tokens.storedAt) >= TokenStore.TOKEN_EXP_LENGTH;
  }
}