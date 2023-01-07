/* eslint-disable max-len */
import { Config } from '../Config';
import { HAP } from '../HAP';
import { Service } from '../interfaces/HAP';
import { AbstractService } from './AbstractService';
import { FilterType } from '../interfaces/PurifierStatus';
import { Logger } from '../Logger';

export class FilterService extends AbstractService {
  register(): void {
    const mainFilterService = this.getOrCreateMainFilterService();
    const preFilterService = this.getOrCreatePreFilterService();

    mainFilterService.getCharacteristic(HAP.Characteristic.FilterChangeIndication)
      .on('get', this.getMainFilterChangeIndication.bind(this));

    mainFilterService.getCharacteristic(HAP.Characteristic.FilterLifeLevel)
      .on('get', this.getMainFilterLifeLevel.bind(this));

    preFilterService.getCharacteristic(HAP.Characteristic.FilterChangeIndication)
      .on('get', this.getPreFilterChangeIndication.bind(this));

    preFilterService.getCharacteristic(HAP.Characteristic.FilterLifeLevel)
      .on('get', this.getPreFilterLifeLevel.bind(this));

    // need to use linked services to get Apple's Home app to show the filter status
    const purifierService = this.accessory.getService(HAP.Service.AirPurifier);
    purifierService.addLinkedService(mainFilterService);
    purifierService.addLinkedService(preFilterService);
  }

  getOrCreateMainFilterService(): Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, Config.Filters.MAIN_FILTER_HAP_SUBTYPE);

    if (!filterService) {
      filterService = this.accessory.addService(HAP.Service.FilterMaintenance, this.purifier.name + ' Max2-filter', Config.Filters.MAIN_FILTER_HAP_SUBTYPE);
    }

    return filterService;
  }

  getOrCreatePreFilterService(): Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, Config.Filters.PRE_FILTER_HAP_SUBTYPE);

    if (!filterService) {
      filterService = this.accessory.addService(HAP.Service.FilterMaintenance, this.purifier.name +' Pre-filter', Config.Filters.PRE_FILTER_HAP_SUBTYPE);
    }

    return filterService;
  }

  async getMainFilterChangeIndication(callback): Promise<void> {
    try {
      const indication = await this.getChangeIndicationForFilter(FilterType.Main);
      callback(null, indication);
    } catch(e) {
      callback(e);
    }
  }

  async getPreFilterChangeIndication(callback) {
    try {
      const indication = await this.getChangeIndicationForFilter(FilterType.Pre);
      callback(null, indication);
    } catch(e) {
      callback(e);
    }
  }

  async getMainFilterLifeLevel(callback): Promise<void> {
    try {
      const lifeLevel = await this.getLifeLevelForFilter(FilterType.Main);
      callback(null, lifeLevel);
    } catch(e) {
      callback(e);
    }
  }

  async getPreFilterLifeLevel(callback): Promise<void> {
    try {
      const lifeLevel = await this.getLifeLevelForFilter(FilterType.Pre);
      callback(null, lifeLevel);
    } catch(e) {
      callback(e);
    }
  }

  async getChangeIndicationForFilter(filterType: FilterType): Promise<any> {
    try {
      const status = await this.purifier.waitForFilterStatusUpdate();
      const statusForFilter = status.find(filter => filter.filterType === filterType);
      let indication;

      if (statusForFilter.lifeLevel <= 20) {
        indication = HAP.Characteristic.FilterChangeIndication.CHANGE_FILTER;
      } else {
        indication = HAP.Characteristic.FilterChangeIndication.FILTER_OK;
      }

      return indication;
    } catch(e) {
      Logger.error(`Unable to get filter change indication for ${FilterType[filterType.toString()]}`, e);
      throw e;
    }
  }

  async getLifeLevelForFilter(filterType: FilterType): Promise<number> {
    try {
      const status = await this.purifier.waitForFilterStatusUpdate();
      const statusForFilter = status.find(filter => filter.filterType === filterType);

      Logger.debug(`Filter ${filterType} (type: ${FilterType[filterType.toString()]} name: '${statusForFilter.name}') life level is ${statusForFilter.lifeLevel}.`);
      return statusForFilter.lifeLevel;
    } catch(e) {
      Logger.error(`Unable to get filter life level for ${FilterType[filterType.toString()]}`, e);
      throw e;
    }
  }
}