import {Component, OnInit} from "@angular/core";
import {LogService, LogEntry} from "../log.service";
import {Observable} from "rxjs";

@Component({
  selector: "app-log-output",
  templateUrl: "./log-output.component.html",
  styleUrls: ["./log-output.component.scss"]
})
export class LogOutputComponent implements OnInit {
  logs$: Observable<LogEntry[]>;

  constructor(private logService: LogService) {}

  ngOnInit() {
    this.logs$ = this.logService.logs$;
  }

  clearLogs() {
    this.logService.clear();
  }
}
