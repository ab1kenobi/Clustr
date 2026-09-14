# Clustr Launch Plan

## Final Goal

Launch a controlled UIC pilot of Clustr by November 14, 2026.

The pilot launch should let verified UIC users safely create, discover, edit, RSVP to, and report campus meetups on real devices. The goal is not a broad public marketplace yet. The goal is a stable, trustworthy campus pilot that can survive real users and teach us what to build next.

## Launch Deadline

- Hard launch deadline: November 14, 2026
- Code freeze target: November 11, 2026
- Release candidate target: November 7, 2026
- Pilot QA window: November 8-13, 2026

## MVP Scope

### Must Have

- Email/password account creation and sign in.
- UIC email or pilot invite-code access gate.
- Email verification required before normal app access.
- Profile onboarding with name, age, location, gender, bio, photo, and interests.
- Discover feed for upcoming UIC meetups.
- Create, edit, and delete meetups.
- Approved UIC campus location selection.
- Optional meetup image upload.
- RSVP and cancel RSVP.
- Capacity enforcement.
- Attendee list.
- Report meetup flow.
- Firestore and Storage rules deployed and verified.
- Internal preview builds for iOS and Android.
- Basic launch documentation: README, setup, Firebase deploy commands, QA checklist.

### Should Have

- CI checks for lint and TypeScript.
- Branch protection on `main`.
- Basic smoke-test checklist for auth, onboarding, create, RSVP, edit, delete, and report.
- Cleaner error states for Firebase permission failures.
- App icon, splash screen, and store-ready screenshots.
- Minimal moderation workflow for reviewing reports.

### Not In First Pilot

- Open non-UIC public launch.
- Payments.
- Chat/messaging.
- Complex recommendation algorithm.
- Multi-campus support beyond the data model being ready for it.
- Full admin dashboard unless reporting volume requires it.

## Current Status

### Working Signals

- Expo app structure is in place.
- Firebase Auth, Firestore, and Storage are wired.
- Main app flows exist in source code.
- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- EAS configuration exists.
- Firebase project is configured as `clustr-1fd1b`.

### Risks

- Local work is not fully committed or pushed.
- `node_modules` is tracked in Git and currently accounts for over 51,000 tracked files.
- `.expo/` local state is tracked and should be removed from Git.
- No GitHub Actions CI exists yet.
- No automated test suite exists yet.
- Expo SDK patch versions are slightly behind expected SDK 54 versions.
- `npm audit` reports dependency advisories that need review.
- GitHub has stale branch/PR state and no active launch milestone.

## Sprint Cadence

Each sprint is one week. Keep every sprint shippable: by the end of each week, `main` should compile, lint, and have a clear demo path.

## Sprint 1: Repo Foundation and Launch Baseline

Dates: September 14-20, 2026

Goal: Make the project clean, reproducible, and ready for focused launch work.

Deliverables:

- Remove `node_modules` from Git tracking while keeping it ignored.
- Remove `.expo/` from Git tracking and ignore it.
- Commit and push the real local app changes.
- Update Expo SDK 54 patch dependencies with `npx expo install`.
- Re-run `npm run lint`, `npx tsc --noEmit`, and `npx expo-doctor`.
- Add GitHub Actions CI for lint and TypeScript.
- Create a launch milestone/backlog in GitHub or mirror this document into issues.
- Decide preview distribution path: TestFlight/internal Android, Expo preview, or both.

Definition of done:

- Fresh clone can run `npm install` without relying on committed dependencies.
- `git status` is readable and does not include generated dependency noise.
- CI exists and passes on the default branch.
- Launch scope and deadline are documented.

## Sprint 2: Auth, Onboarding, and Safety Gate

Dates: September 21-27, 2026

Goal: Make account creation, verification, onboarding, and campus access trustworthy.

Deliverables:

- Test signup with UIC email.
- Test signup with invite code.
- Test blocked signup for non-UIC/no invite.
- Test email verification behavior.
- Verify profile creation and protected field rules.
- Remove unused or half-wired auth code.
- Improve error messages for common auth and permission failures.
- Confirm legal links are reachable and copy is pilot-appropriate.

Definition of done:

- A new pilot user can sign up, verify email, complete onboarding, and land in Discover.
- Invalid users are blocked predictably.
- Auth behavior is documented in the QA checklist.

## Sprint 3: Meetup Core Flow

Dates: September 28-October 4, 2026

Goal: Make event creation and discovery reliable enough for real users.

Deliverables:

- Test create meetup with required fields.
- Test approved UIC location selection.
- Test past-date prevention.
- Test optional capacity.
- Test image upload on web and native.
- Test discover filters and empty states.
- Test edit/delete permissions.
- Add clear loading and failure states where needed.

Definition of done:

- A verified user can create, edit, and delete a meetup without manual database fixes.
- Other verified users can see the event in Discover.
- Permission failures are understandable.

## Sprint 4: RSVP, Reports, and Firebase Rules

Dates: October 5-11, 2026

Goal: Make multi-user behavior and safety rules production-ready.

Deliverables:

- Test RSVP and cancel RSVP across two accounts.
- Test capacity enforcement under repeat clicks.
- Test attendee list visibility.
- Test report creation.
- Deploy and verify Firestore rules.
- Deploy and verify Storage rules.
- Write manual Firebase rules test cases.
- Decide who receives/reviews reports during pilot.

Definition of done:

- RSVP count cannot be trivially corrupted.
- Campus-only access is enforced by both UI and Firebase rules.
- Reports can be reviewed by the team even if there is not a full admin dashboard yet.

## Sprint 5: Device QA and Preview Builds

Dates: October 12-18, 2026

Goal: Put the app on real devices and fix launch-blocking UX issues.

Deliverables:

- Create iOS preview build.
- Create Android preview build.
- Test on at least one iPhone and one Android device.
- Verify image picker, date/time picker, navigation, and safe-area layout.
- Check dark mode or force a stable theme if needed.
- Capture first round of launch screenshots.

Definition of done:

- Internal testers can install and complete the MVP flow on real devices.
- Device-specific blockers are logged and prioritized.

## Sprint 6: Polish and Pilot Operations

Dates: October 19-25, 2026

Goal: Prepare the human side of launch: support, moderation, onboarding, and feedback.

Deliverables:

- Write pilot user instructions.
- Write support/contact path.
- Prepare invite-code policy.
- Prepare moderation/report review process.
- Add basic analytics or manual tracking plan.
- Polish README and setup docs.
- Fix highest-priority tester feedback.

Definition of done:

- A pilot user knows how to join and who to contact.
- The team knows how to handle bad events, reports, and support issues.

## Sprint 7: Release Candidate

Dates: October 26-November 1, 2026

Goal: Stabilize the release candidate.

Deliverables:

- Cut release candidate build.
- Run full QA checklist.
- Freeze new feature work unless it is launch-critical.
- Fix critical and high-priority bugs.
- Verify production Firebase config.
- Verify app metadata, icon, splash, and screenshots.

Definition of done:

- Release candidate can complete every must-have MVP flow.
- Known issues are documented with launch/no-launch decisions.

## Sprint 8: Launch Week

Dates: November 2-14, 2026

Goal: Launch the controlled pilot.

Deliverables:

- Final QA pass.
- Deploy final Firebase rules.
- Build final pilot release.
- Submit or distribute pilot build.
- Invite initial UIC testers.
- Monitor signups, event creation, reports, and crashes.
- Keep a daily launch log.

Definition of done:

- Real UIC pilot users are using Clustr by November 14, 2026.
- The team has a feedback loop and a triage process for issues.

## Week 1 Immediate Checklist

- [x] Remove generated files from Git tracking.
- [x] Update `.gitignore`.
- [x] Update Expo SDK patch packages.
- [x] Run lint, TypeScript, and Expo Doctor.
- [ ] Commit current local app work.
- [ ] Push to GitHub.
- [x] Add CI.
- [x] Verify fresh clone setup with `npm ci`, lint, TypeScript, and Expo Doctor.
- [ ] Create GitHub milestone: `UIC Pilot Launch - Nov 14 2026`.
- [ ] Convert Sprint 1 deliverables into GitHub issues.
