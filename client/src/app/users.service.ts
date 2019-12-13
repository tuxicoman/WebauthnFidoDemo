import {Injectable} from "@angular/core";
import {RelyingPartyProxyService} from "./relying-party-proxy.service";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: "root"
})
export class UsersService {
  private _users: any[];
  private _users$ = new BehaviorSubject<any[]>(this._users);
  public users = this._users$.asObservable();
  constructor(private relyingPatyProxy: RelyingPartyProxyService) {}

  async refreshUsers() {
    this._users = await this.relyingPatyProxy.getUsers();
  }
}
