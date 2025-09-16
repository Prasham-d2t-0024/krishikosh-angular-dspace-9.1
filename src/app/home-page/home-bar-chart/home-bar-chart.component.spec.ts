import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeBarChartComponent } from './home-bar-chart.component';

describe('HomeBarChartComponent', () => {
  let component: HomeBarChartComponent;
  let fixture: ComponentFixture<HomeBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeBarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
