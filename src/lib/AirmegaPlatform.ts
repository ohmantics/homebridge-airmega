import { Authenticator } from './Authenticator';
import { HAP } from './HAP';
import { Accessory, Log, Platform, Service } from './interfaces/HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { AirQualityService } from './services/AirQualityService';
import { FilterService } from './services/FilterService';
import { LightbulbService } from './services/LightbulbService';
import { PurifierService } from './services/PurifierService';
import { PluginConfig } from './interfaces/PluginConfig';
import { TokenStore } from './TokenStore';

export class AirmegaPlatform {
  platform: Platform;
  accessories: Map<string, Accessory>;
  log: Log;
  private _tokenStore: TokenStore;

  constructor(log: Log, config: PluginConfig, platform: Platform) {
    Logger.setLogger(log, config.debug, config.diagnostic);

    this.platform = platform;
    this.accessories = new Map<string, Accessory>();

    if (!this.platform) {
      return;
    }

    this._tokenStore = new TokenStore();

    this.platform.on('didFinishLaunching', () => {
      if (!config.username || !config.password) {
        Logger.error('Username and password fields are required in config', Error());
        return;
      }

      Logger.log('Authenticating...');

      try {
        const authenticator = new Authenticator(this._tokenStore);

        authenticator.login(config.username, config.password).then(tokens => {
          authenticator.getPurifiers(tokens).then(purifiers => {
            purifiers.forEach(purifier => this.registerAccessory(purifier, config));
          }).catch(e => {
            Logger.error('No purifiers', e);
          });
        }).catch(e => {
          Logger.error('Unable to authenticate', e);
        });
      } catch(e) {
        Logger.error('Unable to authenticate', e);
      }
    });
  }

  configureAccessory(accessory: Accessory): void {
    this.accessories.set(accessory.UUID, accessory);
  }

  registerAccessory(purifier: Purifier, config: PluginConfig): void {
    const uuid = HAP.UUID.generate(purifier.name);
    let accessory = this.accessories.get(uuid);

    if (!accessory) {
      accessory = new HAP.Accessory(purifier.name, uuid);
      this.accessories.set(accessory.UUID, accessory);

      this.platform.registerPlatformAccessories('homebridge-airmega', 'Airmega', [accessory]);
    }

    this.registerServices(purifier, accessory, config);

    Logger.log(`Found "${purifier.name}"`);
  }

  registerServices(purifier: Purifier, accessory: Accessory, config: PluginConfig): void {
    accessory.getService(HAP.Service.AccessoryInformation)
      .setCharacteristic(HAP.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(HAP.Characteristic.Model, 'Airmega')
      .setCharacteristic(HAP.Characteristic.SerialNumber, purifier.id);

    const purifierService = new PurifierService(purifier, accessory);
    purifierService.register();

    const airQualityService = new AirQualityService(purifier, accessory);
    airQualityService.register();

    const filterService = new FilterService(purifier, accessory);
    this.cleanupOldFilters(accessory);
    filterService.register();

    const lightService = new LightbulbService(purifier, accessory);

    if (this.shouldExcludeAccessory(config, 'lightbulb')) {
      this.removeService(accessory, HAP.Service.Lightbulb);
    } else {
      lightService.register();
    }
  }

  shouldExcludeAccessory(config: PluginConfig, name: string) {
    if (!('exclude' in config)) {
      return false;
    }

    return config.exclude.includes(name);
  }

  removeService(accessory: Accessory, service: Service): void {
    accessory.services.forEach(existingService => {
      if (existingService.UUID === service.UUID) {
        accessory.removeService(existingService);
      }
    });
  }

  // Some older versions of this plugin used the Coway protocol's filter codes as the Homebridge subtype.
  // Clean out any old filter accessories that were registered using those potentially varying codes.
  cleanupOldFilters(accessory: Accessory) {
    for (const subtype of ['3111735', '3121332', '3104756']) {
      const oldFilter = accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, subtype);
      if (oldFilter) {
        Logger.log(`Removing old filter registered as ${subtype}.`);
        accessory.removeService(oldFilter);
      }
    }
    this.platform.updatePlatformAccessories([accessory]);
  }
}