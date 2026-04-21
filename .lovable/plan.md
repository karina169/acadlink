

## Grant admin access to mdintelligenceroom@gmail.com

You're seeing "Access Denied" because your account doesn't have the `admin` role yet. I'll fix that and make sure this email is always promoted to admin automatically.

### What I'll do

1. **Sign up the account** (if not already): Register `mdintelligenceroom@gmail.com` with the password you provided through the normal Auth screen — this creates the `auth.users` row and the matching `profiles` row via the existing `handle_new_user` trigger.

2. **Grant the admin role**: Insert a row into `public.user_roles` with `role = 'admin'` for that user's `user_id`. This is what `has_role(auth.uid(), 'admin')` checks, and what the `/admin` route guard uses.

3. **Auto-promote on future signups (safety net)**: Update the `handle_new_user` trigger so that whenever a user signs up with the email `mdintelligenceroom@gmail.com`, an `admin` row is automatically inserted into `user_roles`. This way, even if the account is ever deleted and recreated, it stays admin — and no other email can gain admin this way.

4. **Verify**: After the migration runs, refresh `/admin` — the Access Denied screen should be replaced with the full Admin Dashboard (Users, Group Chats, Courses, etc.).

### Security notes

- The password you sent is only used by you to log in through the normal sign-in form — it's stored hashed by the auth system, never in plain text, and I won't put it anywhere in the code.
- Admin status is enforced server-side via the `user_roles` table + RLS, not by email checks in the client, so it can't be spoofed.
- Only this exact email gets the auto-promote rule. All other signups remain regular users.

### After approval

Once you approve, I'll switch to build mode, run the migration, and confirm the admin dashboard loads for you.

