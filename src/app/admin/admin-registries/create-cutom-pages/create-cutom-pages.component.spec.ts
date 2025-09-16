import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCutomPagesComponent } from './create-cutom-pages.component';

describe('CreateCutomPagesComponent', () => {
  let component: CreateCutomPagesComponent;
  let fixture: ComponentFixture<CreateCutomPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCutomPagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCutomPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
