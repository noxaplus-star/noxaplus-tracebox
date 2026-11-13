## What changed

<!-- One or two sentences. Why does this exist? -->

## How it was verified

<!-- Test names, commands, or a screenshot for dashboard changes. -->

```bash
npm run typecheck
npm test
npm run build
```

## Notes for reviewers

- [ ] Behavior stays local (no new outbound calls or services)
- [ ] New buffering respects the configured limits
- [ ] Redaction docs match what the patterns actually do
- [ ] Tests use real servers, not mocks
