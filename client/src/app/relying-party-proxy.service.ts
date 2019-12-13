import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {first, map} from "rxjs/operators";
import {coerceToArrayBuffer} from "./utils/coerceToArrayBuffer";
import {coerceToBase64Url} from "./utils/coerceToBase64Url";

@Injectable({
  providedIn: "root"
})
export class RelyingPartyProxyService {
  private _apiBase = "http://localhost:5000/api/";
  private _webauthnBase = this._apiBase + "auth/";
  private _httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/json"
    })
  };

  constructor(private http: HttpClient) {}

  getRegisterOptions(
    username: string
  ): Promise<PublicKeyCredentialCreationOptions> {
    const registerOptions = this.http
      .get(this._webauthnBase + "registerOptions/" + username)
      .pipe(
        first(),
        makePublicKeyCredentialCreationOptions()
      )
      .toPromise();

    return registerOptions;
  }
  register(attestationResponse: PublicKeyCredential) {
    return this.http
      .post(
        this._webauthnBase + "register",
        this.makeAuthenticatorAttestationRawResponse(attestationResponse),
        this._httpOptions
      )
      .pipe(first())
      .toPromise();
  }
  getLoginOptions(username: string) {
    return this.http
      .get(this._webauthnBase + "LoginOptions/" + username)
      .pipe(
        first(),
        makePublicKeyCredentialRequestOptions()
      )
      .toPromise();
  }
  login(assertionResponse: PublicKeyCredential) {
    return this.http
      .post(
        this._webauthnBase + "login",
        this.makeAuthenticatorAssertionRawResponse(assertionResponse),
        this._httpOptions
      )
      .pipe(first())
      .toPromise();
  }

  getUsers(): Promise<any[]> {
    return this.http
      .get(this._webauthnBase + "users")
      .pipe(first())
      .toPromise() as Promise<any>;
  }
  getCredentials(): Promise<any[]> {
    return this.http
      .get(this._webauthnBase + "credentials")
      .pipe(first())
      .toPromise() as Promise<any>;
  }

  resetStorage(): Promise<Object> {
    return this.http
      .get(this._webauthnBase + "resetStorage")
      .pipe(first())
      .toPromise();
  }
  private makeAuthenticatorAssertionRawResponse(
    assertedCredential: PublicKeyCredential
  ) {
    const authData = new Uint8Array(
      (assertedCredential.response as AuthenticatorAssertionResponse).authenticatorData
    );
    const clientDataJSON = new Uint8Array(
      assertedCredential.response.clientDataJSON
    );
    const rawId = new Uint8Array(assertedCredential.rawId);
    const sig = new Uint8Array(
      (assertedCredential.response as AuthenticatorAssertionResponse).signature
    );
    return {
      id: assertedCredential.id,
      rawId: coerceToBase64Url(rawId),
      type: assertedCredential.type,
      // extensions: assertedCredential.getClientExtensionResults(),
      response: {
        authenticatorData: coerceToBase64Url(authData),
        clientDataJson: coerceToBase64Url(clientDataJSON),
        signature: coerceToBase64Url(sig)
      }
    };
  }

  private makeAuthenticatorAttestationRawResponse(
    newCredential: PublicKeyCredential
  ) {
    // Move data into Arrays incase it is super long
    const attestationObject = new Uint8Array(
      (newCredential.response as AuthenticatorAttestationResponse).attestationObject
    );
    const clientDataJSON = new Uint8Array(
      newCredential.response.clientDataJSON
    );
    const rawId = new Uint8Array(newCredential.rawId);

    return {
      id: newCredential.id,
      rawId: coerceToBase64Url(rawId),
      type: newCredential.type as any,
      extensions: null,
      response: {
        attestationObject: coerceToBase64Url(attestationObject),
        clientDataJson: coerceToBase64Url(clientDataJSON)
      }
    };
  }
}

function makePublicKeyCredentialRequestOptions() {
  return map((registerOptions: PublicKeyCredentialRequestOptions) => {
    registerOptions.challenge = coerceToArrayBuffer(
      registerOptions.challenge as undefined
    );
    registerOptions.allowCredentials = (registerOptions.allowCredentials as any[]).map(
      allowCred => ({
        ...allowCred,
        id: coerceToArrayBuffer(allowCred.id),
        transports: allowCred.transports as any
      })
    );
    return registerOptions;
  });
}

function makePublicKeyCredentialCreationOptions() {
  return map((options: PublicKeyCredentialCreationOptions) => {
    options.challenge = coerceToArrayBuffer(options.challenge as any);
    options.user.id = coerceToArrayBuffer(options.user.id as any);
    options.excludeCredentials = options.excludeCredentials.map(o => ({
      ...o,
      id: coerceToArrayBuffer(o.id as any)
    }));
    return options;
  });
}
