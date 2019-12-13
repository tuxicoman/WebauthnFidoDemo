import {Component, OnInit} from "@angular/core";
import {RelyingPartyProxyService} from "../relying-party-proxy.service";

@Component({
  selector: "app-userlist",
  templateUrl: "./userlist.component.html",
  styleUrls: ["./userlist.component.scss"]
})
export class UserlistComponent implements OnInit {
  public userlist: any[];
  constructor(private relyingPartyProxy: RelyingPartyProxyService) {}

  async ngOnInit() {
    await this.refreshUserList();
  }

  async refreshUserList() {
    this.userlist = await this.relyingPartyProxy.getUsers();
  }

  async resetStorage() {
    await this.relyingPartyProxy.resetStorage();
    this.refreshUserList();
  }
}
