import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeTrendingItemComponent } from './home-trending-item.component';

describe('HomeTrendingItemComponent', () => {
  let component: HomeTrendingItemComponent;
  let fixture: ComponentFixture<HomeTrendingItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeTrendingItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeTrendingItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
