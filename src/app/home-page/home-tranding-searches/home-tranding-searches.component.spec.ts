import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrandingSearchesComponent } from './home-tranding-searches.component';

describe('HomeTrandingSearchesComponent', () => {
  let component: HomeTrandingSearchesComponent;
  let fixture: ComponentFixture<HomeTrandingSearchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrandingSearchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrandingSearchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
