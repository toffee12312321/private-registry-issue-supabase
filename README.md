# 🧪 Supabase + Verdaccio Repro: Custom Path Registry Bug

## ✅ Prerequisites

Edit `/etc/hosts`:

```
127.0.0.1 registry.local
```

> Ensures both the host machine and Supabase Edge Runtime can resolve `registry.local`.

Create a Docker network so Supabase and Verdaccio can communicate:

```bash
docker network create verdaccio_net
```

---

## ✅ Working Case: Verdaccio mounted at root (`/`)

Ensure the following `.npmrc` files:

- `my-package/.npmrc`
- `supabase/functions/my-function/.npmrc`

Contain:

```ini
@my-company:registry=http://registry.local
//registry.local/:_authToken=MmU3NzdiMDgxNWNmYTAzYTgzZGJhNGU3ZjQ4ZmI4MDY6OTgyNjQxZTU2MTAyYjNiNmQz
```

Start Verdaccio:

```bash
docker compose -f docker-compose.working.yml up
```

Bump the package version in:

- `my-package/package.json`
- `supabase/functions/my-function/deno.json`

Publish the package:

```bash
cd my-package && npm publish --registry=http://registry.local
```

Start Supabase:

```bash
npx supabase@2.22.12 start
```

Serve functions in debug mode:

```bash
npx supabase@2.22.12 functions serve --debug
```

Connect the edge runtime container to the Verdaccio network:

```bash
docker network connect verdaccio_net supabase_edge_runtime_private-registry-issue-supabase
```

Call the function:

```bash
curl http://127.0.0.1:54321/functions/v1/my-function
```

✅ You should see the expected output:

```json
{ "response": "Hello, World!" }
```

---

## ❌ Failing Case: Verdaccio mounted under `/some-path`

Update your `.npmrc` files to:

```ini
@my-company:registry=http://registry.local/some-path/
//registry.local/some-path/:_authToken=MmU3NzdiMDgxNWNmYTAzYTgzZGJhNGU3ZjQ4ZmI4MDY6OTgyNjQxZTU2MTAyYjNiNmQz
```

Start Verdaccio:

```bash
docker compose -f docker-compose.failing.yml up
```

Bump package versions again as before.

Publish package:

```bash
cd my-package && npm publish --registry=http://registry.local
```

Start Supabase:

```bash
npx supabase@2.22.12 start
```

Serve functions in debug mode:

```bash
npx supabase@2.22.12 functions serve --debug
```

Connect the edge runtime container to the Verdaccio network:

```bash
docker network connect verdaccio_net supabase_edge_runtime_private-registry-issue-supabase
```

Call the function:

```bash
curl http://127.0.0.1:54321/functions/v1/my-function
```

❌ You'll see the error:

```json
{ "code": "BOOT_ERROR", "message": "Worker failed to boot (please check logs)" }
```

And in the Edge Runtime logs:

```txt
InvalidWorkerCreation: worker boot error: Failed resolving '@my-company/my-package@1.0.3' in '/var/tmp/sb-compile-edge-runtime/node_modules/localhost/some-path/@my-company/my-package/1.0.3'.
    at async UserWorker.create (ext:sb_user_workers/user_workers.js:139:15)
    ...
```
