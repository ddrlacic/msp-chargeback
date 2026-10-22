import { TestBed } from '@angular/core/testing';

import { ShellLayout } from './shell-layout.service';

describe('ShellLayout', () => {
  let layout: ShellLayout;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ShellLayout] });
    layout = TestBed.inject(ShellLayout);
  });

  it('starts on desktop with the sidebar open and the drawer closed', () => {
    expect(layout.isDesktop()).toBe(true);
    expect(layout.sidebarOpen()).toBe(true);
    expect(layout.drawerOpen()).toBe(false);
  });

  it('hides and shows the sidebar on desktop without opening the drawer', () => {
    layout.toggleSidebar();
    expect(layout.sidebarOpen()).toBe(false);
    expect(layout.drawerOpen()).toBe(false);

    layout.toggleSidebar();
    expect(layout.sidebarOpen()).toBe(true);
  });

  it('closes the drawer', () => {
    layout.drawerOpen.set(true);

    layout.closeDrawer();
    expect(layout.drawerOpen()).toBe(false);
  });
});
