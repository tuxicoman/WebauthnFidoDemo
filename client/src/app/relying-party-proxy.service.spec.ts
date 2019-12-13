import { TestBed } from '@angular/core/testing';

import { RelyingPartyProxyService } from './relying-party-proxy.service';

describe('RelyingPartyProxyService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RelyingPartyProxyService = TestBed.get(RelyingPartyProxyService);
    expect(service).toBeTruthy();
  });
});
