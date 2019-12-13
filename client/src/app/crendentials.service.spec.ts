import { TestBed } from '@angular/core/testing';

import { CrendentialsService } from './crendentials.service';

describe('CrendentialsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CrendentialsService = TestBed.get(CrendentialsService);
    expect(service).toBeTruthy();
  });
});
