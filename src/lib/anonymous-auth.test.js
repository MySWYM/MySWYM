/**
 * Run: node src/lib/anonymous-auth.test.js
 */
import {
  convertAnonymousWithEmail,
  ensureAnonymousSession,
  isAnonymousUser,
} from "./anonymous-auth.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("anonymous-auth");

assert(!isAnonymousUser(null), "null");
assert(!isAnonymousUser({ id: "u1", email: "a@b.c" }), "real email");
assert(isAnonymousUser({ id: "u1", is_anonymous: true }), "is_anonymous flag");
assert(
  isAnonymousUser({
    id: "u1",
    identities: [{ provider: "anonymous" }],
  }),
  "identities anonymous",
);
assert(
  !isAnonymousUser({
    id: "u1",
    is_anonymous: false,
    identities: [{ provider: "apple" }],
  }),
  "apple identity",
);

{
  const calls = [];
  const supabase = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "existing" } } }, error: null }),
      signInAnonymously: async () => {
        calls.push("anon");
        return { data: { user: { id: "new" } }, error: null };
      },
    },
  };
  const user = await ensureAnonymousSession(supabase);
  assert(user.id === "existing", "reuse session");
  assert(calls.length === 0, "no double anon");
}

{
  const supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInAnonymously: async () => ({
        data: { user: { id: "anon1", is_anonymous: true } },
        error: null,
      }),
    },
  };
  const user = await ensureAnonymousSession(supabase);
  assert(user.id === "anon1", "creates anonymous");
}

{
  const supabase = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "a1", is_anonymous: true } } },
        error: null,
      }),
      updateUser: async (payload) => ({
        data: { user: { id: "a1", email: payload.email, is_anonymous: false } },
        error: null,
      }),
    },
  };
  const user = await convertAnonymousWithEmail(supabase, {
    email: "Ada@Example.com",
    password: "secret12",
    data: { confirmed_age_18: true },
  });
  assert(user.email === "ada@example.com", "email lowercased via update");
  assert(user.id === "a1", "same id");
}

{
  let threw = false;
  try {
    await convertAnonymousWithEmail(
      {
        auth: {
          getSession: async () => ({
            data: { session: { user: { id: "r1", email: "x@y.z" } } },
            error: null,
          }),
        },
      },
      { email: "a@b.c", password: "x" },
    );
  } catch (e) {
    threw = e.message === "NOT_ANONYMOUS";
  }
  assert(threw, "refuse convert on real user");
}

console.log("anonymous-auth ok");
