import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTestProviders } from '../../testing/providers';
import { PageBreadcrumb, PageComponent } from './page.component';

@Component({
  imports: [PageComponent],
  template: `
    <app-page title="Chargebacks" description="Review chargebacks" [breadcrumbs]="breadcrumbs">
      @if (withToolbar) {
        <div pageToolbar>Filters</div>
      }
      <div class="scroller"><p>Content</p></div>
    </app-page>
  `,
})
class HostComponent {
  breadcrumbs: readonly PageBreadcrumb[] = [];
  withToolbar = true;
}

interface ScrollSize {
  readonly top: number;
  readonly height: number;
  readonly clientHeight: number;
}

describe('PageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: getTestProviders(),
    }).compileComponents();
  });

  async function setup(
    options: { breadcrumbs?: readonly PageBreadcrumb[]; withToolbar?: boolean } = {},
  ): Promise<ComponentFixture<HostComponent>> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.breadcrumbs = options.breadcrumbs ?? [];
    fixture.componentInstance.withToolbar = options.withToolbar ?? true;
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function scroll(
    fixture: ComponentFixture<HostComponent>,
    { top, height, clientHeight }: ScrollSize,
  ): Promise<void> {
    const scroller = (fixture.nativeElement as HTMLElement).querySelector('.scroller');
    if (!scroller) {
      throw new Error('Missing scroller');
    }
    Object.defineProperty(scroller, 'scrollTop', { value: top, configurable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: height, configurable: true });
    Object.defineProperty(scroller, 'clientHeight', { value: clientHeight, configurable: true });
    scroller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function header(fixture: ComponentFixture<HostComponent>): HTMLElement {
    const element = (fixture.nativeElement as HTMLElement).querySelector('header');
    if (!element) {
      throw new Error('Missing header');
    }
    return element;
  }

  it('shows the title and description on a main page', async () => {
    const element = (await setup()).nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Chargebacks');
    expect(element.querySelector('h1')?.classList.contains('sr-only')).toBe(false);
    expect(element.querySelector('header p')?.textContent?.trim()).toBe('Review chargebacks');
    expect(element.querySelector('nav[aria-label="Breadcrumb"]')).toBe(null);
  });

  it('shows only breadcrumbs on an inner page and keeps the title for screen readers', async () => {
    const fixture = await setup({
      breadcrumbs: [{ label: 'Chargebacks', link: '/chargebacks' }, { label: 'CB-1' }],
    });
    const element = fixture.nativeElement as HTMLElement;
    const items = element.querySelectorAll('nav[aria-label="Breadcrumb"] li');

    expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/chargebacks');
    expect(items[1].querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('CB-1');
    expect(element.querySelector('h1')?.classList.contains('sr-only')).toBe(true);
    expect(element.querySelector('header p')).toBe(null);
    expect(header(fixture).classList.contains('py-3')).toBe(true);
  });

  it('offers a back link to the nearest linked parent for narrow screens', async () => {
    const fixture = await setup({
      breadcrumbs: [
        { label: 'Chargebacks', link: '/chargebacks' },
        { label: 'CB-1', link: '/chargebacks/CB-1' },
        { label: 'Challenge chargeback' },
      ],
    });
    const element = fixture.nativeElement as HTMLElement;
    const back = element.querySelector('a[data-back]');

    expect(back?.textContent?.trim()).toBe('Back to CB-1');
    expect(back?.getAttribute('href')).toBe('/chargebacks/CB-1');
    expect(element.querySelector('nav ol')?.classList.contains('hidden')).toBe(true);
  });

  it('has no back link when the trail has no linked parent', async () => {
    const fixture = await setup({ breadcrumbs: [{ label: 'CB-1' }] });
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[data-back]')).toBe(null);
    expect(element.querySelector('nav ol')?.classList.contains('hidden')).toBe(false);
  });

  it('shrinks the main page header once the content scrolls and restores it at the top', async () => {
    const fixture = await setup();

    await scroll(fixture, { top: 40, height: 1200, clientHeight: 400 });
    expect(header(fixture).hasAttribute('data-compact')).toBe(true);
    expect(header(fixture).querySelector('h1')?.classList.contains('text-body')).toBe(true);

    await scroll(fixture, { top: 0, height: 1200, clientHeight: 400 });
    expect(header(fixture).hasAttribute('data-compact')).toBe(false);
  });

  it('keeps the header while the scroll is within the first few pixels', async () => {
    const fixture = await setup();

    await scroll(fixture, { top: 6, height: 1200, clientHeight: 400 });

    expect(header(fixture).hasAttribute('data-compact')).toBe(false);
  });

  it('projects toolbar and content into their slots', async () => {
    const element = (await setup()).nativeElement as HTMLElement;

    expect(element.querySelector('[pageToolbar]')?.textContent).toBe('Filters');
    expect(element.querySelector('section > div:last-child p')?.textContent).toBe('Content');
  });

  it('leaves the toolbar empty so it hides when nothing is projected', async () => {
    const toolbar = ((await setup({ withToolbar: false })).nativeElement as HTMLElement).querySelector(
      'section > div',
    );

    expect(toolbar?.matches(':empty')).toBe(true);
  });
});
