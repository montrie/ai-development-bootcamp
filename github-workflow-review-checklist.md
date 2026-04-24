# GitHub Workflow Review Checklist

Use this checklist when reviewing a new GitHub Actions workflow file.

---

## Timeout

- [ ] A `timeout-minutes` is set at the job level (or step level where appropriate)
- [ ] The timeout is set to **10 minutes** or less, unless a longer duration is explicitly justified

## Permissions

- [ ] Permissions are explicitly defined — either at the workflow level or per job
- [ ] Only the minimum required permissions are granted (Principle of Least Privilege)
- [ ] No broad `write-all` or `read-all` permissions unless fully justified

## Secrets

- [ ] No secret values are echoed, printed, or logged in any step
- [ ] Secrets are only passed via environment variables or dedicated GitHub Actions input mechanisms, never inline in `run` commands
- [ ] No secrets are exposed in workflow outputs or artifacts

## Dependency Caching

- [ ] If the workflow installs dependencies (npm, pip, Maven, etc.), caching is set up (e.g. `actions/cache` or built-in cache options like `actions/setup-node` with `cache:`)
- [ ] The cache key is based on a lockfile (e.g. `package-lock.json`, `requirements.txt`) to ensure cache invalidation on dependency changes

## Step Naming

- [ ] Every step has a `name` field
- [ ] Step names clearly describe what the step does (e.g. `Install dependencies`, not `Run step 3`)

## Trigger

- [ ] The `on:` trigger is appropriate for the workflow's purpose
- [ ] Branch filters, path filters, or event types are scoped correctly to avoid unintended runs
- [ ] The workflow does not trigger on events broader than necessary
