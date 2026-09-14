// The private project fixture from the /api/ask spec, on top of a real record so
// every other field exists. Its readme deliberately holds addresses.
import { projectById } from '../../src/content/projects.ts';

export const privateFixture = () => ({
  ...projectById('loop'),
  id: 'secret',
  name: 'Secret Ledger',
  private: true,
  scope: 'Team-built; code is private.',
  repos: [{ label: 'x', url: 'https://github.com/x/y' }],
  readmeUrl: 'https://github.com/x/y#readme',
  readme: 'A private readme that mentions https://github.com/x/y and http://internal.example/docs.',
});
