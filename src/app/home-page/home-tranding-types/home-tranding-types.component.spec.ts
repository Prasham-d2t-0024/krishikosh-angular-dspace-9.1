import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrandingTypesComponent } from './home-tranding-types.component';

describe('HomeTrandingTypesComponent', () => {
  let component: HomeTrandingTypesComponent;
  let fixture: ComponentFixture<HomeTrandingTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrandingTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrandingTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
