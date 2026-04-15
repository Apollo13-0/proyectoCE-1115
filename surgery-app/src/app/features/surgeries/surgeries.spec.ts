import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Surgeries } from './surgeries';

describe('Surgeries', () => {
  let component: Surgeries;
  let fixture: ComponentFixture<Surgeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Surgeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Surgeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
