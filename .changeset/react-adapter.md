---
"@unicore/query": patch
"@unicore/react": minor
---

Add @unicore/react (QueryProvider, useQuery, useMutation). QueryObserver now reports an optimistic loading state before mount and no longer refetches when setOptions is called with unchanged options.
