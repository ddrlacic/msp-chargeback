import { TestBed } from '@angular/core/testing';
import { ChargebacksComponent } from './chargebacks.component';

describe('ChargebacksComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChargebacksComponent] }).compileComponents();
  });

  it('should render the page title', () => {
    const fixture = TestBed.createComponent(ChargebacksComponent);
    fixture.detectChanges();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(heading?.textContent).toBe('Chargebacks');
  });
});
