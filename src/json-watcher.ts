import axios from "axios";
import { configManager } from "./config/config-manager";
import { logError } from "./utils/log-utils";

export class JSONWatcher<T> {
  private interval?: NodeJS.Timeout;

  constructor(
    private url: string,
    private onChange: (data: T) => void,
  ) {}

  private updateData(): void {
    this.getData()
      .then((data) => {
        return this.onChange(data);
      })
      .catch((err) => logError(`Fetch ${this.url}`, err));
  }

  async getData(): Promise<T> {
    return axios.get<T>(this.url).then((res) => res.data);
  }

  start() {
    this.updateData();

    this.interval = setInterval(() => {
      this.updateData();
    }, configManager.intervalMs);
  }

  stop() {
    clearInterval(this.interval);
  }
}
