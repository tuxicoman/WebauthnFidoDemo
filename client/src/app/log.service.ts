import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";

export type LogEntry = {
  title: string;
  data: any;
  type: "info" | "error";
};

@Injectable({
  providedIn: "root"
})
export class LogService {
  private _logs: LogEntry[] = [];
  private _logs$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(
    this._logs
  );

  public logs$ = this._logs$.asObservable();

  constructor() {}

  add(title: string, log: any, type?: "info" | "error") {
    console.log(log);
    this._logs.push({title, data: log, type});
    this._logs$.next(this._logs);
  }

  clear() {
    this._logs = [];
    this._logs$.next(this._logs);
  }
}
