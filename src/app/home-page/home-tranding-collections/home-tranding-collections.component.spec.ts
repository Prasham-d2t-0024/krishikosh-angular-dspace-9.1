import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrandingCollectionsComponent } from './home-tranding-collections.component';

describe('HomeTrandingCollectionsComponent', () => {
  let component: HomeTrandingCollectionsComponent;
  let fixture: ComponentFixture<HomeTrandingCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrandingCollectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrandingCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
