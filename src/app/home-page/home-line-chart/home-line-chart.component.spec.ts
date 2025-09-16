import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLineChartComponent } from './home-line-chart.component';

describe('HomeLineChartComponent', () => {
  let component: HomeLineChartComponent;
  let fixture: ComponentFixture<HomeLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
