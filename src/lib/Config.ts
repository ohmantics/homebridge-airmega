/* eslint-disable max-len */
export const Config = {
  BASE_URI : 'https://iocareapp.coway.com/bizmob.iocare',
  USER_AGENT : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1 app',
  ACCEPT : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  ACCEPT2 : 'application/json, text/plain, */*',
  ACCEPT_LANGUAGE : 'en-US,en;q=0.9',

  ContentType : {
    FORM : 'application/x-www-form-urlencoded',
    JSON : 'application/json',
  },

  Auth : {
    OPENID_URL : 'https://id.coway.com/auth/realms/cw-account/protocol/openid-connect/auth',
    SIGNIN_URL : 'https://idp.coway.com/user/signin/',
    REDIRECT_URL : 'https://iocareapp.coway.com/bizmob.iocare/redirect/redirect.html',
    REDIRECT_URL2 : 'https://iocareapp.coway.com/bizmob.iocare/redirect/redirect_bridge.html',
    CLIENT_ID : 'UmVuZXdhbCBBcHA',
    OPENID_CLIENT_ID : 'cwid-prd-iocare-20220930',
    SERVICE_CODE : 'com.coway.IOCareKor',
    COWAY_ACCESS_TOKEN : 'coway_access_token',
    COWAY_REFRESH_TOKEN : 'coway_refresh_token',
  },

  Endpoints : {
    DEVICE_LIST : 'CWIG0304',
    DEVICE_REFRESH : 'CWIG0602',
    TOKEN_REFRESH : 'CWIL0100',
    STATUS : 'CWIA0120',
    CONTROL : 'CWIG0603',
    FILTERS : 'CWIA0800',
  },

  Codes : {
    POWER : '0001',
    MODE : '0002',
    FAN : '0003',
    LIGHT : '0007',
  },

  Filters : {
    PRE_FILTER_HAP_SUBTYPE : 'pre',
    MAIN_FILTER_HAP_SUBTYPE : 'main',
    // 300S/400S filters
    //PRE_FILTER_CODE : '3121332',
    //MAIN_FILTER_CODE : '3104756', // previously 3111735

    // AP-1512HHS filters
    //PRE_FILTER_CODE : '3109126,',
    //MAIN_FILTER_CODE : '3107167'
  },
} as const;
