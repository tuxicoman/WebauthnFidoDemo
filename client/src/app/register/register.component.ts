import {Component, OnInit} from "@angular/core";
import {RelyingPartyProxyService} from "../relying-party-proxy.service";
import {coerceToArrayBuffer} from "../utils/coerceToArrayBuffer";
import {LogService} from "../log.service";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent implements OnInit {
  public userName: string;
  constructor(
    private relyingPartyProxy: RelyingPartyProxyService,
    private logService: LogService
  ) {}

  ngOnInit() {}

  async register() {
    try {
      //1. Retrieve register options (aka attestationOptoins) from RP
      let registerOptions = await this.relyingPartyProxy.getRegisterOptions(
        this.userName
      );
      this.logService.add("register options ", registerOptions);

      //2. Create credentials with WebauthnAPI
      let credential = (await navigator.credentials.create({
        publicKey: registerOptions
      })) as PublicKeyCredential;
      this.logService.add("credentials.create", credential);

      //3. Submit credentials for register
      let result = await this.relyingPartyProxy.register(credential);
      this.logService.add("register result", result);
    } catch (e) {
      //log errors
      this.logService.add("Error in register", e.message, "error");
    }
  }
}
