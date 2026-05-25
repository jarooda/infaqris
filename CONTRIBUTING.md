# Contributing

We welcome contributions! To keep the codebase clean and maintainable, please follow the conventions below.

---

## ✅ Semantic Commit Messages

Use the following format for your commits:

**Format:**  
`<type>(<scope>): <subject>`

- `<scope>` is optional.
- Use present tense and be concise.

### 🧪 Example

```text
feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, test, etc.
```

### Allowed Types

| Type       | Description                                |
| ---------- | ------------------------------------------ |
| `feat`     | A new feature                              |
| `fix`      | A bug fix                                  |
| `docs`     | Documentation changes only                 |
| `chore`    | Maintenance tasks (deps, config, tooling)  |
| `style`    | Formatting, whitespace — no logic change   |
| `refactor` | Code restructuring without behavior change |
| `ci`       | CI/CD configuration changes                |
| `test`     | Adding or updating tests                   |
| `revert`   | Revert a previous commit                   |
| `perf`     | Performance improvements                   |
