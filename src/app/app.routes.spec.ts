import { routes } from './app.routes';

describe('app routes', () => {
  const shellChildren = routes[0].children ?? [];

  it('serves the chargeback list, case and respond pages inside the shell', () => {
    expect(shellChildren.map((route) => route.path)).toEqual([
      '',
      'chargebacks',
      'chargebacks/:caseId',
      'chargebacks/:caseId/respond',
      'dashboard',
      'deposit-details',
      'sub-merchants',
      'transactions',
      'statements',
      'settings/users',
      'settings/roles',
    ]);
  });

  it('opens the chargeback list by default', () => {
    expect(shellChildren[0].redirectTo).toBe('chargebacks');
    expect(routes.at(-1)?.redirectTo).toBe('');
  });
});
