import { Client } from './Client';
import { AirQuality, Fan, FilterStatus, Light, Mode, Power, Status } from './interfaces/PurifierStatus';
import { StatusUpdater } from './StatusUpdater';
import { TokenStore } from './TokenStore';

export class Purifier {
  id: string;
  name: string;
  power: Power;
  light: Light;
  fan: Fan;
  mode: Mode;
  airQuality: AirQuality;

  client: Client;

  purifierStatusUpdater: StatusUpdater<Status>;
  filterStatusUpdater: StatusUpdater<FilterStatus[]>;

  constructor(id: string, name: string, tokenStore: TokenStore) {
    this.id = id;
    this.name = name;

    this.client = new Client(tokenStore);

    this.purifierStatusUpdater = new StatusUpdater<Status>();
    this.filterStatusUpdater = new StatusUpdater<FilterStatus[]>();
  }

  setStatus(status: Status): void {
    this.power = status.power;
    this.light = status.light;
    this.fan = status.fan;
    this.mode = status.mode;
    this.airQuality = status.airQuality;
  }

  async waitForStatusUpdate(): Promise<Status> {
    const status = await this.purifierStatusUpdater.wait(() =>
      this.client.getStatus(this.id),
    );

    this.setStatus(status);

    return status;
  }

  async waitForFilterStatusUpdate(): Promise<FilterStatus[]> {
    const status = await this.filterStatusUpdater.wait(() =>
      this.client.getFilterStatus(this.id),
    );

    return status;
  }
}