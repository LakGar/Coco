# Next Steps to Ship MVP

## 🎯 Current Status

### ✅ Completed
- **Authentication**: Clerk integration with sign-up/sign-in
- **Onboarding Flow**: Multi-step form for user setup and team creation
- **Database**: Prisma schema with User, CareTeam, CareTeamMember models
- **Email System**: Resend integration with branded email templates
- **User Sync**: Automatic sync from Clerk to Prisma via webhooks
- **Dashboard UI**: Sidebar, header, and layout structure
- **Onboarding Guard**: Redirects incomplete onboarding to setup
- **Team Invites**: Email invites sent to patient and team members

---

## 🚨 Critical MVP Requirements (Must Have)

### 1. **Invite Acceptance Flow** ⚠️ BLOCKER
**Priority: P0 - Cannot ship without this**

- [ ] Create `/accept-invite` page that:
  - Validates invite code from URL query param
  - Shows invite details (team name, inviter, role)
  - Allows user to sign up/sign in with Clerk
  - Links Clerk user to existing CareTeamMember record
  - Creates User record if patient
  - Updates CareTeamMember with `userId` and `acceptedAt`
  - Updates CareTeam `patientId` if patient accepts
  - Redirects to dashboard after acceptance

- [ ] Create API route `/api/accept-invite`:
  - Validates invite code
  - Checks if invite is expired (7 days)
  - Verifies email matches invite
  - Creates/links User record
  - Updates team membership
  - Sends notification emails to team

**Files to create:**
- `app/accept-invite/page.tsx`
- `app/api/accept-invite/route.ts`

---

### 2. **Dashboard Content** ⚠️ HIGH PRIORITY
**Priority: P0 - Core user experience**

- [ ] Replace placeholder boxes with real content:
  - [ ] Patient overview card (name, status, key info)
  - [ ] Recent activity feed
  - [ ] Quick actions (add task, message team, etc.)
  - [ ] Team member list (with status: active/pending)
  - [ ] Upcoming tasks/appointments section

- [ ] Fetch and display real data from database:
  - Current user's teams
  - Team members (accepted + pending)
  - Patient information
  - Recent activities

**Files to update:**
- `app/dashboard/page.tsx`

---

### 3. **Team Management** ⚠️ HIGH PRIORITY
**Priority: P1 - Essential for collaboration**

- [ ] Team member management page (`/dashboard/team`):
  - [ ] List all team members (accepted + pending invites)
  - [ ] Show member roles and access levels
  - [ ] Add new team members (invite flow)
  - [ ] Remove team members (admin only)
  - [ ] Update member permissions
  - [ ] Resend invites for pending members

- [ ] API routes:
  - [ ] `GET /api/teams/[teamId]/members` - Get team members
  - [ ] `POST /api/teams/[teamId]/invite` - Invite new member
  - [ ] `DELETE /api/teams/[teamId]/members/[memberId]` - Remove member
  - [ ] `PATCH /api/teams/[teamId]/members/[memberId]` - Update permissions

**Files to create:**
- `app/dashboard/team/page.tsx`
- `app/api/teams/[teamId]/members/route.ts`
- `app/api/teams/[teamId]/invite/route.ts`

---

### 4. **Active Team State Management** ⚠️ HIGH PRIORITY
**Priority: P1 - Needed for multi-team support**

- [ ] Create team context/provider:
  - [ ] Store active team ID
  - [ ] Fetch user's teams from database
  - [ ] Sync with URL params (`?team=team-id`)
  - [ ] Persist to localStorage
  - [ ] Update TeamSwitcher to use real data

- [ ] Update TeamSwitcher component:
  - [ ] Fetch teams from database (not hardcoded)
  - [ ] Show actual team names
  - [ ] Handle team switching
  - [ ] Update URL and context on switch

**Files to create:**
- `contexts/team-context.tsx` or `hooks/use-team.tsx`
- Update `components/team-switcher.tsx`
- Update `components/app-sidebar.tsx`

---

### 5. **Environment Variables Setup** ⚠️ MEDIUM PRIORITY
**Priority: P1 - Required for deployment**

- [ ] Document all required env vars:
  - [ ] `DATABASE_URL` - PostgreSQL connection
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `WEBHOOK_SECRET` - Clerk webhook verification
  - [ ] `RESEND_API_KEY` - Email service
  - [ ] `RESEND_FROM_EMAIL` - Sender email
  - [ ] `NEXT_PUBLIC_APP_URL` - App URL for invite links

- [ ] Create `.env.example` file with all variables
- [ ] Update `EMAIL_SETUP.md` with complete setup guide

**Files to create:**
- `.env.example`

---

## 🔧 Important Improvements (Should Have)

### 6. **Error Handling & Edge Cases**
**Priority: P2**

- [ ] Handle expired invites gracefully
- [ ] Handle duplicate invite acceptance
- [ ] Handle invalid invite codes
- [ ] Handle email mismatches
- [ ] Add loading states throughout
- [ ] Add error boundaries
- [ ] Handle database connection errors

---

### 7. **Team Data Integration**
**Priority: P2**

- [ ] Update AppSidebar to fetch real teams:
  - [ ] Replace hardcoded `data.teams` with database query
  - [ ] Show actual team names from user's memberships
  - [ ] Handle empty state (no teams)

- [ ] Update navigation items:
  - [ ] Make sidebar links functional
  - [ ] Add team-scoped routes
  - [ ] Update active states based on current team

**Files to update:**
- `components/app-sidebar.tsx`

---

### 8. **User Profile & Settings**
**Priority: P2**

- [ ] User profile page (`/dashboard/settings`):
  - [ ] Display user information
  - [ ] Edit profile (name, city, state)
  - [ ] Change email (via Clerk)
  - [ ] Account settings

- [ ] API route:
  - [ ] `PATCH /api/user/profile` - Update user profile

**Files to create:**
- `app/dashboard/settings/page.tsx`
- `app/api/user/profile/route.ts`

---

### 9. **Access Control Enforcement**
**Priority: P2**

- [ ] Implement access level checks:
  - [ ] READ_ONLY users can't edit/delete
  - [ ] FULL access users can manage team
  - [ ] Admin-only actions protected
  - [ ] Team-scoped data filtering

- [ ] Create middleware/utilities:
  - [ ] `lib/auth/check-access.ts` - Verify user permissions
  - [ ] `lib/auth/get-team-member.ts` - Get user's team membership

**Files to create:**
- `lib/auth/check-access.ts`
- `lib/auth/get-team-member.ts`

---

## 🎨 Nice to Have (Can Wait)

### 10. **UI/UX Enhancements**
**Priority: P3**

- [ ] Add empty states for all pages
- [ ] Improve loading skeletons
- [ ] Add success/error toast notifications
- [ ] Improve mobile responsiveness
- [ ] Add animations/transitions

---

### 11. **Testing & Quality**
**Priority: P3**

- [ ] Add basic E2E tests for critical flows:
  - [ ] Sign up → Onboarding → Dashboard
  - [ ] Invite acceptance flow
  - [ ] Team member management

- [ ] Add API route tests
- [ ] Test email delivery
- [ ] Test error scenarios

---

### 12. **Documentation**
**Priority: P3**

- [ ] Update README with:
  - [ ] Setup instructions
  - [ ] Architecture overview
  - [ ] Deployment guide
  - [ ] Environment variables

- [ ] Add inline code comments
- [ ] Document API endpoints

---

## 📋 MVP Launch Checklist

### Pre-Launch
- [ ] All P0 items completed
- [ ] All P1 items completed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Email service tested
- [ ] Invite flow end-to-end tested
- [ ] Error handling in place
- [ ] Basic access control working

### Launch Day
- [ ] Deploy to production
- [ ] Configure production environment variables
- [ ] Set up production database
- [ ] Configure Clerk for production domain
- [ ] Configure Resend for production domain
- [ ] Test sign-up flow in production
- [ ] Test invite acceptance in production
- [ ] Monitor error logs

---

## 🎯 Recommended Implementation Order

1. **Week 1: Core Functionality**
   - Invite acceptance flow (#1)
   - Dashboard content (#2)
   - Environment setup (#5)

2. **Week 2: Team Features**
   - Team management (#3)
   - Active team state (#4)
   - Team data integration (#7)

3. **Week 3: Polish & Launch**
   - Error handling (#6)
   - Access control (#9)
   - User profile (#8)
   - Final testing

---

## 📝 Notes

- **Invite acceptance is the #1 blocker** - users can't join teams without it
- **Dashboard content is critical** - users need to see value immediately
- **Team management is essential** - core collaboration feature
- **State management** will make multi-team support seamless
- Focus on P0 and P1 items first, P2 and P3 can come post-MVP

---

## 🔗 Related Files

- Email setup: `EMAIL_SETUP.md`
- Database schema: `prisma/schema.prisma`
- Onboarding API: `app/api/onboarding/route.ts`
- Email service: `lib/email.ts`

