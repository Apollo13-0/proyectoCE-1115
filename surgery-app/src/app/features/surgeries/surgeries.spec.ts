import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { SurgeriesComponent } from './surgeries';

describe('Surgeries', () => {
  let component: SurgeriesComponent;
  let fixture: ComponentFixture<SurgeriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurgeriesComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurgeriesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
