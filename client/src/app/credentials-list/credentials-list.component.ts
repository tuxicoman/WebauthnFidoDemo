import {Component, OnInit} from "@angular/core";
import {RelyingPartyProxyService} from "../relying-party-proxy.service";

@Component({
  selector: "app-credentials-list",
  templateUrl: "./credentials-list.component.html",
  styleUrls: ["./credentials-list.component.scss"]
})
export class CredentialsListComponent implements OnInit {
  credentialsList: any[];

  constructor(private relyinPartyProxy: RelyingPartyProxyService) {}

  async ngOnInit() {
    await this.refreshCredentialList();
  }

  async refreshCredentialList() {
    this.credentialsList = await this.relyinPartyProxy.getCredentials();
  }
}
