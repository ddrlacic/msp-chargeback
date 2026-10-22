import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';

import { provideAppIcons } from '../icons';
import { CLOCK, Clock } from '../shared/clock';

export const TEST_TODAY = new Date(2026, 9, 22, 12, 0, 0);

export function createFixedClock(date: Date = TEST_TODAY): Clock {
  return { now: () => new Date(date) };
}

export function getTestProviders(routes: Routes = []): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter(routes, withComponentInputBinding()),
    provideAppIcons(),
    { provide: CLOCK, useValue: createFixedClock() },
  ];
}
