# Docker commands

## Debugging

Debug Application
```bash
docker compose -f compose.debug.yml up --build
```

Debug Tests:
```bash
docker compose -f compose.debug.yml run --service-ports --build backend-test 
```

To debug a single test set the TESTCLASS env variable to the class you want to use in the .env file
```bash
docker compose -f compose.debug.yml run --service-ports --build backend-test-single 
```

To run with only Chromium and no retries, use:                                

```bash 
docker compose --env-file .env run --rm e2e-test npx playwright test --project=chromium --retries=0
```                                                                             
  Or to run a specific spec file too:                                           
                                                                     
  docker compose --env-file .env run --rm e2e-test npx playwright test          
  bdd/tests/v2_addTodo.spec.ts --project=chromium --retries=0 