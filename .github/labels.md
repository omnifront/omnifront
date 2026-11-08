`labels.json` lists the labels the project uses. Create them once with the GitHub CLI:

```bash
jq -c '.[]' .github/labels.json | while read -r l; do
  gh label create "$(echo "$l" | jq -r .name)" --color "$(echo "$l" | jq -r .color)" \
    --description "$(echo "$l" | jq -r .description)" --force
done
```
