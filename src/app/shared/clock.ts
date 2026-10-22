import { InjectionToken } from '@angular/core';

export interface Clock {
  now(): Date;
}

export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => ({ now: () => new Date() }),
});
