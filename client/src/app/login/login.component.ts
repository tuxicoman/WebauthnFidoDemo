import {Component, OnInit} from "@angular/core";
import {RelyingPartyProxyService} from "../relying-party-proxy.service";
import {LogService} from "../log.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit {
  public userName: string;
  constructor(
    private relyingPartyProxy: RelyingPartyProxyService,
    private logService: LogService
  ) {}

  ngOnInit() {}

  async login() {
    try {
      //1. Retrieve register options (aka assertionOptions) from RP
      let loginOptions = await this.relyingPartyProxy.getLoginOptions(
        this.userName
      );
      this.logService.add("login options", loginOptions);

      let credentials = (await navigator.credentials.get({
        publicKey: loginOptions
      })) as PublicKeyCredential;
      this.logService.add("login credentials", credentials);

      let loginResult = await this.relyingPartyProxy.login(credentials);
      this.logService.add("Login result", loginResult);
    } catch (e) {
      //log errors
      this.logService.add("Error in login", e.message, "error");
    }
  }
}
