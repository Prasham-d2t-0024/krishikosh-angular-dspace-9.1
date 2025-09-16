import { TestBed } from '@angular/core/testing';

import { FaqDataService } from './faq-data.service';

describe('FaqDataService', () => {
  let service: FaqDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaqDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
