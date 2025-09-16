import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayMapComponent } from './display-map.component';

describe('DisplayMapComponent', () => {
  let component: DisplayMapComponent;
  let fixture: ComponentFixture<DisplayMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayMapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
