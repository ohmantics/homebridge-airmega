import * as request from 'request-promise';
import { parse } from 'node-html-parser';
import { decode } from 'html-entities';

import { Client } from './Client';
import { Config } from './Config';
import { OpenIDPayload, AuthCode2Payload, Payload } from './interfaces/Request';
import { TokenPair } from './interfaces/TokenStore';
import { Logger } from './Logger';
import { Purifier } from './Purifier';

export class Authenticator extends Client {

  async login(username: string, password: string): Promise<TokenPair> {
    const authCode = await this.authenticateOpenID(username, password);

    if (!authCode) {
      throw Error('Couldn\'t get authentication code.');
    }
    Logger.debug('got authCode', authCode);
    const tokens = await this.getTokensFromOpenIDAuthCode(authCode);

    this.tokenStore.saveTokens(tokens);

    return tokens;
  }

  async getPurifiers(tokens: TokenPair): Promise<Purifier[]> {
    const payload = this.buildDeviceListPayload(tokens);
    Logger.debug('Sending payload', payload);

    const response = await request.post(payload);
    Logger.debug('Got response', response);

    if (!response.body?.deviceInfos) {
      throw Error('Coudln\'t get purifier list.');
    }
    return response.body?.deviceInfos.map(device => new Purifier(device.barcode, device.dvcNick, this.tokenStore));
  }

  async refreshTokens(oldTokens: TokenPair): Promise<TokenPair> {
    const payload = this.buildTokenRefreshPayload(oldTokens);
    Logger.debug('Sending payload', payload);

    const response = await request.post(payload);
    Logger.debug('Got response', response);

    const tokens = {
      accessToken: response.header.accessToken,
      refreshToken: response.header.refreshToken,
    };

    return tokens;
  }

  private async authenticateOpenID(username: string, password: string): Promise<string> {
    const payload = this.buildOpenIDPayload();
    Logger.debug('Sending payload', payload);

    const response = await request.get(payload);
    Logger.debug('Got response', response);

    const cookies = response.headers['set-cookie'];

    // //*[@id="kc-form-login"]/@action
    let root = parse.parse(response.body);
    let form = root.getElementById('kc-form-login');
    const action = form.getAttribute('action');

    const payload2 = this.buildOpenID2Payload(cookies, username, password);
    payload2.uri = decode(action);
    Logger.debug('Sending payload2', payload2);

    let response2 = await request.post(payload2);
    Logger.debug('Get response2', response2);

    // We should get a 302 with a Location header. If we get a page back, then
    // we're being asked to update the password. We'll defer that.
    if (response2.statusCode === 200 &&
        response2.headers['content-type'].indexOf('text/html') !== -1) {
      Logger.log('Coway is asking that the password be updated as it has been at least 60 days since the last change. Deferring.');

      root = parse.parse(response2.body);
      form = root.getElementById('kc-password-change-form');
      const form_uri = decode(form.getAttribute('action'));

      const payload3 = this.buildPasswordChangeDeferPayload(cookies);
      payload3.uri = form_uri;
      Logger.debug('Sending payload3', payload3);
      response2 = await request.post(payload3);
      Logger.debug('Get response2 again', response2);
    }

    const location_hdr = response2.headers['location'];
    return location_hdr?.match(/[^&]+&code=(.*)/)[1];
  }

  private async getTokensFromOpenIDAuthCode(authCode: string): Promise<TokenPair> {
    const payload = this.buildFinishOpenIDPayload(authCode);
    Logger.debug('Sending payload', payload);

    const response = await request.post(payload);
    Logger.debug('Got response', response);

    const tokens = {
      accessToken: response.header.accessToken,
      refreshToken: response.header.refreshToken,
    };

    return tokens;
  }

  private buildOpenIDPayload(): OpenIDPayload {
    const payload: OpenIDPayload = {
      uri: Config.Auth.OPENID_URL,
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': Config.USER_AGENT,
        'Accept': Config.ACCEPT,
        'Accept-Language': Config.ACCEPT_LANGUAGE,
      },
      qs: {
        auth_type: 0,
        response_type: 'code',
        client_id: Config.Auth.OPENID_CLIENT_ID,
        ui_locales: 'en_US',
        dvc_cntry_id: 'US',
        redirect_uri: Config.Auth.REDIRECT_URL2,
      },
    };

    return payload;
  }

  private buildOpenID2Payload(cookies: string, username: string, password: string): AuthCode2Payload {
    const payload: AuthCode2Payload = {
      uri: '',
      simple: false,
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': Config.USER_AGENT,
        Cookie: cookies,
      },
      form: {
        termAgreementStatus: '',
        idp: '',
        username: username,
        password: password,
        rememberMe: 'on',
      },
    };

    return payload;
  }

  private buildPasswordChangeDeferPayload(cookies: string): AuthCode2Payload {
    const payload: AuthCode2Payload = {
      uri: '',
      simple: false,
      resolveWithFullResponse: true,
      headers: {
        'User-Agent': Config.USER_AGENT,
        Cookie: cookies,
      },
      form: {
        cmd: 'change_next_time',
        checkPasswordNeededYn: 'Y',
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      },
    };

    return payload;
  }

  private buildFinishOpenIDPayload(authCode: string): Payload {
    const message = {
      header: {
        result: false,
        error_code: '',
        error_text: '',
        info_text: '',
        message_version: '',
        login_session_id: '',
        trcode: Config.Endpoints.TOKEN_REFRESH,
        accessToken: '',
        refreshToken: '',
      },
      body: {
        authCode: authCode,
        isMobile: 'M',
        langCd: 'en',
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL2,
        serviceCode: Config.Auth.SERVICE_CODE,
      },
    };

    const payload = this.buildPayload(Config.Endpoints.TOKEN_REFRESH, message);

    return payload;
  }

  private buildDeviceListPayload(tokens: TokenPair): Payload {
    const message = {
      header: {
        trcode: Config.Endpoints.DEVICE_LIST,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      body: {
        pageIndex: '0',
        pageSize: '100',
      },
    };

    const payload = this.buildPayload(Config.Endpoints.DEVICE_LIST, message);

    return payload;
  }

  private buildTokenRefreshPayload(tokens: TokenPair): Payload {
    const message = {
      header: {
        trcode: Config.Endpoints.TOKEN_REFRESH,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      body: {
        isMobile: 'M',
        langCd: 'en',
        osType: 1,
        redirectUrl: Config.Auth.REDIRECT_URL,
        serviceCode: Config.Auth.SERVICE_CODE,
      },
    };

    const payload = this.buildPayload(Config.Endpoints.TOKEN_REFRESH, message);

    return payload;
  }
}