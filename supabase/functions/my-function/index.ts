import { myFunction } from "@my-company/my-package";

Deno.serve(() => {
  return new Response(
    JSON.stringify({
      response: myFunction(),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
