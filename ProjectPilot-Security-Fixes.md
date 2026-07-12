# ProjectPilot — Security & Code Review Fixes

Consolidated from a review of `authController.js`, `auth.js`, `api.js`, `validation.js`, `projectController.js`, and `projects.html`. Files not yet reviewed (`taskController.js`, `tasks.html`, `userController.js`, `server.js`, routes, `User.js`) may contain the same patterns flagged here — see the checklist at the end.

Checkboxes are there so you can tick items off as you patch them.

---

## 🔴 Critical

### 1. Hardcoded fallback JWT secret
**Files:** `authController.js`, `auth.js`

```js
jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyprojectpilot2026', { expiresIn: '30d' })
jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyprojectpilot2026')
```

If `JWT_SECRET` is ever unset (bad deploy, missing `.env`, staging misconfig), the app silently signs/verifies tokens with this now-public string. Anyone can forge a token for any user, including an admin.

**Fix:** fail fast instead of falling back. Put this in one shared config module both files import:

```js
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required — refusing to start without it.');
}
module.exports = { JWT_SECRET };
```

Then use `JWT_SECRET` (no `||` fallback) in both `generateToken` and `protect`.

- [ ] Remove fallback secret from `authController.js`
- [ ] Remove fallback secret from `auth.js`
- [ ] Rotate `JWT_SECRET` in `.env` (the old value is now exposed and should be treated as compromised)

---

### 2. Stored XSS — sidebar username
**File:** `api.js` (`renderSidebar()`, both implementations)

```js
<span class="user-name">${user.username}</span>
```

`validateRegister` doesn't restrict `username` characters — only length. A username containing HTML/JS executes on every authenticated page (sidebar renders site-wide), and since the JWT lives in `localStorage`, a successful payload can exfiltrate it directly → full account takeover, including of admins who view the attacker's username anywhere it's rendered.

**Fix — add an escape helper to `api.js` and use it everywhere user data hits `innerHTML`:**

```js
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
```

```js
<span class="user-name">${escapeHtml(user.username)}</span>
```

- [ ] Add `escapeHtml()` to `api.js`
- [ ] Apply it in both `renderSidebar` implementations (`user.username`)
- [ ] Restrict `username` charset server-side too (see Fix #7 below) — belt and suspenders

---

### 3. Stored XSS — project title/description/category
**File:** `projects.html` (`renderProjects()`)

```js
<span class="project-category">${proj.category}</span>
...
<h3>${proj.title}</h3>
<p>${proj.description}</p>
```

Same root cause as #2, but wider blast radius: any authenticated user can create a project, and every authenticated user who opens `/projects` renders it. `description` is free text and can't be charset-restricted, so escaping at render time is the real fix here — validation alone can't close this one.

**Fix:**

```js
<span class="project-category">${escapeHtml(proj.category)}</span>
...
<h3>${escapeHtml(proj.title)}</h3>
<p>${escapeHtml(proj.description)}</p>
```

(`statusText`, `formattedDeadline`, and `proj._id` are safe — derived from an enum, a `Date`, and a hex-validated ObjectId respectively, not raw user input.)

- [ ] Add/import `escapeHtml()` in `projects.html`'s inline script (or move it into `api.js` and reference `API.escapeHtml`)
- [ ] Apply to `proj.category`, `proj.title`, `proj.description`
- [ ] Check `tasks.html` for the identical pattern on task title/description — highly likely to exist there too

---

## 🟠 High

### 4. Password change doesn't invalidate existing tokens
**Files:** `authController.js`, `auth.js`, `User.js`

`updatePassword` changes the hash but does nothing to existing JWTs — a stolen token stays valid for up to 30 days even after the user "secures" their account by changing password.

**Fix:**

Add a field to the User schema:
```js
passwordChangedAt: { type: Date }
```

Set it in the pre-save hook whenever password is modified (alongside the hashing logic), then check it in `protect`:

```js
if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
  return res.status(401).json({ success: false, message: 'Token invalid, password was changed. Please log in again.' });
}
```

- [ ] Add `passwordChangedAt` to `User.js` schema
- [ ] Set it in the pre-save hook on password change
- [ ] Check it in `protect` (`auth.js`)

---

### 5. Mass assignment in `updateProject`
**File:** `projectController.js`

```js
project = await Project.findByIdAndUpdate(req.params.id, req.body, {
  new: true,
  runValidators: true
});
```

The whole raw request body is forwarded to Mongoose. Nothing stops a project owner from sending `{ "progress": 100 }` or `{ "createdBy": "<someone else's id>" }` — bypassing the "progress is system-calculated only" rule and allowing silent ownership hijack.

**Fix — whitelist fields explicitly:**

```js
const allowedFields = ['title', 'description', 'category', 'status', 'deadline'];
const updates = {};
for (const field of allowedFields) {
  if (req.body[field] !== undefined) updates[field] = req.body[field];
}

project = await Project.findByIdAndUpdate(req.params.id, updates, {
  new: true,
  runValidators: true
});
```

- [ ] Apply field whitelist in `updateProject`
- [ ] Check `taskController.js`'s `updateTask` for the same pattern — task `progress`/`status` recalculation likely has the identical bug

---

### 6. No rate limiter on `/api/auth/register`
**File:** routes (not yet reviewed directly, confirmed by absence in BRAIN.md's middleware column)

Only `/api/auth/login` has `loginLimiter`. Registration is open to automated account spam and can be used to enumerate taken emails/usernames via the "already exists" error.

**Fix:** apply the same (or a slightly looser) rate limiter to the register route in `authRoutes.js`:

```js
router.post('/register', registerLimiter, validateRegister, registerUser);
```

- [ ] Add a rate limiter to `/api/auth/register`
- [ ] Confirm `/api/auth/updatepassword` also has reasonable rate limiting (repeated wrong-password attempts shouldn't be unlimited either)

---

### 7. `category` not enum-validated server-side
**File:** `validation.js`

```js
if (!category || typeof category !== 'string' || category.trim().length === 0) {
```

The UI's `<select>` only offers 5 categories, but the server accepts any non-empty string. Anyone hitting the API directly can submit arbitrary text (including markup — ties into fix #3).

**Fix:**

```js
const VALID_PROJECT_CATEGORIES = ['Development', 'Design', 'Marketing', 'Research', 'Operations'];
// ...
if (!category || !VALID_PROJECT_CATEGORIES.includes(category)) {
  return res.status(400).json({ success: false, message: 'Invalid project category' });
}
```

Apply in both the POST and PUT branches of `validateProject`.

- [ ] Add category enum check to `validateProject` (POST branch)
- [ ] Add category enum check to `validateProject` (PUT branch)

Also, restrict `username` to a safe charset while you're in this file:

```js
if (!username || typeof username !== 'string' || username.trim().length < 3 || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim())) {
  return res.status(400).json({ success: false, message: 'Username must be 3-30 characters and may only contain letters, numbers, underscores, periods, and hyphens' });
}
```

- [ ] Add charset restriction to `validateRegister`

---

## 🟡 Medium

### 8. "First registered user becomes admin" race condition
**File:** `authController.js`

```js
const isFirstUser = (await User.countDocuments()) === 0;
```

If the database is ever empty in production (fresh deploy, disaster recovery, a bug that wipes the users collection), whoever registers first — teammate or attacker — gets `admin`.

**Suggested fix:** gate real admin creation behind an invite code or an env-configured allowlist of admin emails, instead of "first come, first served":

```js
const ADMIN_ALLOWLIST = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
const role = ADMIN_ALLOWLIST.includes(normalizedEmail) ? 'admin' : 'user';
```

- [ ] Decide on an admin-provisioning strategy that doesn't depend on registration order
- [ ] Update `registerUser` accordingly

---

### 9. Login timing side-channel (email enumeration)
**File:** `authController.js`

```js
const user = await User.findOne({ email: normalizedEmail }).select('+password');
if (user && (await user.matchPassword(password))) { ... }
```

Non-existent email → fast response (no bcrypt call). Existing email + wrong password → slower response (bcrypt runs). The timing gap lets an attacker probe which emails are registered.

**Fix:** always run a dummy bcrypt compare when `user` is null, so both paths take similar time:

```js
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Nchqzt5ynAKW7l/gS4A0Wg8w8Y8Vy'; // any valid bcrypt hash
if (user) {
  if (await user.matchPassword(password)) { /* success path */ }
} else {
  await bcrypt.compare(password, DUMMY_HASH);
}
```

- [ ] Add dummy-compare branch to `loginUser`

---

### 10. NoSQL operator injection via `status` query param
**File:** `projectController.js` (`getProjects`)

```js
if (status) {
  andConditions.push({ status });
}
```

Express's query parser turns `?status[$ne]=completed` into `req.query.status = { $ne: 'completed' }`, which gets pushed straight into the Mongo filter as a live operator. Currently limited in impact (ANDed with the role-based visibility filter, so it can't bypass access control on its own) but still unintended and worth closing.

**Fix:**

```js
if (status && VALID_PROJECT_STATUSES.includes(status)) {
  andConditions.push({ status });
}
```

Also add `express-mongo-sanitize` as global middleware in `server.js` so `$`-prefixed keys get stripped from `req.query`/`req.body` app-wide:

```js
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

- [ ] Whitelist `status` against the enum in `getProjects`
- [ ] Add `express-mongo-sanitize` globally in `server.js`
- [ ] Check `taskController.js`'s `getTasks` for the same `status`/`priority` pattern

---

### 11. Regex DoS via `search`/`category` filters
**File:** `projectController.js` (`getProjects`)

```js
{ category: { $regex: category, $options: 'i' } }
{ title: { $regex: search, $options: 'i' } }
```

User input is passed directly as a regex pattern. A pathological pattern can trigger slow catastrophic-backtracking matches — a cheap DoS lever.

**Fix:** escape regex metacharacters before building the pattern:

```js
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// then use escapeRegex(search) / escapeRegex(category) inside the $regex filters
```

- [ ] Escape `search` before use in `$regex`
- [ ] Escape `category` before use in `$regex`

---

### 12. No cap on `limit` query param
**File:** `projectController.js` (`getProjects`, and likely `getTasks`/`getUsers`)

```js
const limitNum = parseInt(limit, 10) || 10;
```

Fully client-controlled — `?limit=999999` still applies, which is a cheap way to force a large, expensive query.

**Fix:**

```js
const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
```

- [ ] Clamp `limit` in `getProjects`
- [ ] Clamp `limit` in `getTasks` and `getUsers` (once reviewed)

---

### 13. No server-side token revocation
**Documented gap in BRAIN.md itself** — tokens are valid for 30 days with no way to invalidate a specific stolen token short of rotating `JWT_SECRET` (which logs out everyone).

**Suggested fix (medium-term):** a Redis or DB-backed denylist of revoked token IDs (`jti` claim), checked in `protect`. Short-term cheaper mitigation: shorten expiry (e.g. 7 days) and add a refresh-token flow.

- [ ] Decide on revocation strategy (denylist vs. shorter expiry + refresh tokens)
- [ ] Implement chosen approach

---

## 🟢 Low / Hardening

### 14. Raw `error.message` returned to clients on 500s
**File:** `projectController.js` (every catch block), likely repeated elsewhere

```js
res.status(500).json({ success: false, message: error.message });
```

Can leak internal details (field names, cast errors, connection info).

**Fix:**

```js
} catch (error) {
  console.error(error);
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
}
```

- [ ] Apply across `projectController.js`
- [ ] Apply across other controllers once reviewed

---

### 15. `error.message` unescaped in `innerHTML`
**File:** `projects.html`

```js
projectsContainer.innerHTML = `<p ...>Error loading projects catalog: ${error.message}</p>`;
```

Low risk today (message comes from your own server), but wrap in `escapeHtml()` anyway for consistency and future-proofing.

- [ ] Escape `error.message` in the catch block of `fetchProjects`

---

### 16. No max length on `description` fields
**File:** `validation.js`

Only `title` is capped at 100 characters; `description` has no upper bound on either Project or Task. Add a cap (e.g. 2000–5000 chars) purely to prevent oversized-payload abuse.

- [ ] Add max-length check to `description` in `validateProject`
- [ ] Add max-length check to `description` in `validateTask`

---

### 17. "Forgot password?" link has no backing endpoint
**File:** `login.html`

The link exists in the UI but no `/api/auth/forgot-password` (or similar) endpoint appears in the route table. Either wire up a real flow (token-based reset email) or remove/disable the link until it's built, so it's not a dead-end for users.

- [ ] Decide: build the endpoint, or hide the link until it exists

---

### 18. Project creator's email exposed to all project viewers
**File:** `projectController.js` (`getProjects`, `getProjectById`)

```js
.populate('createdBy', 'username email')
```

Any user who can see a project (creator, admin, or anyone with a task assigned to it) also sees the creator's email. Likely fine for an internal tool — just confirm it's intentional rather than a default that slipped through.

- [ ] Confirm intentional, or drop `email` from the populate projection

---

## Not yet reviewed — check for repeated patterns

These files weren't shared yet, but based on what's been found, they should be checked for the same issues:

- [ ] **`taskController.js`** — mass assignment in `updateTask` (issue #5 pattern), operator injection in `getTasks` filters (issue #10 pattern), raw `error.message` leaks (issue #14 pattern)
- [ ] **`tasks.html`** — unescaped `innerHTML` for task title/description (issue #3 pattern)
- [ ] **`userController.js`** — confirm admin-only guard on `deleteUser` is enforced server-side (not just hidden in UI), confirm self-deletion prevention
- [ ] **`users.html`** — unescaped `innerHTML` for usernames/emails in the admin member directory (issue #2/#3 pattern)
- [ ] **`server.js`** — confirm `helmet`, `cors` (with an explicit allowed-origins list), and `express-mongo-sanitize` are present; add if missing
- [ ] **`User.js`** model — confirm `password` field really has `select: false` as documented, and note the `passwordChangedAt` addition from issue #4

---

## Suggested general hardening (not tied to a specific bug found)

- [ ] Add `helmet` for standard security headers (including a basic CSP as defense-in-depth against any XSS that slips through)
- [ ] Add explicit `cors` config restricting allowed origins in production
- [ ] Validate required env vars (`JWT_SECRET`, `MONGO_URI`) at boot and fail fast if missing
- [ ] Consider bumping bcrypt salt rounds from 10 → 12
