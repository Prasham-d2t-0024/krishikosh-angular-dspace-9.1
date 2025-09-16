import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrandingCommunitiesComponent } from './home-tranding-communities.component';

describe('HomeTrandingCommunitiesComponent', () => {
  let component: HomeTrandingCommunitiesComponent;
  let fixture: ComponentFixture<HomeTrandingCommunitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrandingCommunitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrandingCommunitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
