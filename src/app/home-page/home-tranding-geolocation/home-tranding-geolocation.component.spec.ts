import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrandingGeolocationComponent } from './home-tranding-geolocation.component';

describe('HomeTrandingGeolocationComponent', () => {
  let component: HomeTrandingGeolocationComponent;
  let fixture: ComponentFixture<HomeTrandingGeolocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrandingGeolocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrandingGeolocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
