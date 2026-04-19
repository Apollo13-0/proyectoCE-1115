import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Patients } from './patients';

describe('Patients', () => {
  let component: Patients;
  let fixture: ComponentFixture<Patients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patients],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Patients);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
