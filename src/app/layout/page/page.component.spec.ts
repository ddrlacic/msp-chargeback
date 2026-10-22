import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../testing/providers';
import { PageBreadcrumb, PageComponent } from './page.component';

@Component({
  imports: [PageComponent],
  template: `
    <app-page
      title="Case CB-1"
      description="Cardholder says the order never arrived"
      [breadcrumbs]="breadcrumbs"
    >
      @if (withToolbar) {
        <div pageToolbar>Filters</div>
      }
      <p>Content</p>
    </app-page>
  `,
})
class HostComponent {
  breadcrumbs: readonly PageBreadcrumb[] = [
    { label: 'Chargebacks', link: '/chargebacks' },
    { label: 'CB-1' },
  ];
  withToolbar = true;
}

describe('PageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  function render(withToolbar = true): HTMLElement {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.withToolbar = withToolbar;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the title and description', () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Case CB-1');
    expect(element.querySelector('header p')?.textContent?.trim()).toBe(
      'Cardholder says the order never arrived',
    );
  });

  it('links every breadcrumb except the current page', () => {
    const element = render();
    const items = element.querySelectorAll('nav[aria-label="Breadcrumb"] li');

    expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/chargebacks');
    expect(items[1].querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('CB-1');
  });

  it('projects toolbar and content into their slots', () => {
    const element = render();

    expect(element.querySelector('[pageToolbar]')?.textContent).toBe('Filters');
    expect(element.querySelector('section > div:last-child p')?.textContent).toBe('Content');
  });

  it('leaves the toolbar empty so it hides when nothing is projected', () => {
    const toolbar = render(false).querySelector('section > div');

    expect(toolbar?.matches(':empty')).toBe(true);
  });
});
