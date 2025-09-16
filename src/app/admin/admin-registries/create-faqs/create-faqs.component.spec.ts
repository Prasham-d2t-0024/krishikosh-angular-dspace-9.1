import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFAQsComponent } from './create-faqs.component';

describe('CreateFAQsComponent', () => {
  let component: CreateFAQsComponent;
  let fixture: ComponentFixture<CreateFAQsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFAQsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFAQsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
