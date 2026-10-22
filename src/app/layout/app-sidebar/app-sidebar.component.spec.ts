import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { getTestProviders } from '../../testing/providers';
import { ShellLayout } from '../shell/shell-layout.service';
import { AppSidebarComponent } from './app-sidebar.component';

@Component({ template: '' })
class EmptyPageComponent {}

describe('AppSidebarComponent', () => {
  let layout: ShellLayout;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        ShellLayout,
        ...getTestProviders([
          { path: 'chargebacks', component: EmptyPageComponent },
          { path: 'settings/users', component: EmptyPageComponent },
        ]),
      ],
    }).compileComponents();
    layout = TestBed.inject(ShellLayout);
  });

  async function render(url = '/chargebacks'): Promise<HTMLElement> {
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function linkLabels(element: HTMLElement): string[] {
    return [...element.querySelectorAll('nav > ul > li > a, nav > ul > li > button')].map(
      (item) => item.textContent?.trim() ?? '',
    );
  }

  it('lists the MSP items in sentence case', async () => {
    const element = await render();

    expect(linkLabels(element)).toEqual([
      'Dashboard',
      'Deposit details',
      'Sub-merchants',
      'Chargebacks',
      'Transactions',
      'Statements',
      'Settings',
    ]);
  });

  it('marks Chargebacks as the current page', async () => {
    const element = await render();
    const current = element.querySelector('a[aria-current="page"]');

    expect(current?.textContent?.trim()).toBe('Chargebacks');
  });

  it('opens and closes the Settings group', async () => {
    const element = await render();
    const settings = element.querySelector<HTMLButtonElement>('nav button[aria-expanded]');

    settings?.click();
    TestBed.tick();
    expect(settings?.getAttribute('aria-expanded')).toBe('true');
    expect(
      [...element.querySelectorAll('#sidebar-group-6 a')].map((a) => a.textContent?.trim()),
    ).toEqual(['Users', 'Roles']);

    settings?.click();
    TestBed.tick();
    expect(element.querySelector('#sidebar-group-6')).toBe(null);
  });

  it('opens the Settings group when one of its pages is active', async () => {
    const element = await render('/settings/users');

    expect(
      element.querySelector('#sidebar-group-6 a[aria-current="page"]')?.textContent?.trim(),
    ).toBe('Users');
  });

  it('closes the drawer when a page is chosen', async () => {
    const element = await render();
    layout.drawerOpen.set(true);

    element.querySelector<HTMLAnchorElement>('a[aria-current="page"]')?.click();

    expect(layout.drawerOpen()).toBe(false);
  });
});
