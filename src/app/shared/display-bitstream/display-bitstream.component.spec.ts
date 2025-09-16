import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayBitstreamComponent } from './display-bitstream.component';

describe('DisplayBitstreamComponent', () => {
  let component: DisplayBitstreamComponent;
  let fixture: ComponentFixture<DisplayBitstreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayBitstreamComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayBitstreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
