# Sprint 1 GitHub Issues

Use these as the initial GitHub issues for the `UIC Pilot Launch - Nov 14 2026` milestone.

## Issue: Create UIC Pilot Launch Milestone

Labels: `sprint-1`, `launch`

Create the GitHub milestone `UIC Pilot Launch - Nov 14 2026`.

Target dates:

- Hard launch deadline: November 14, 2026
- Code freeze target: November 11, 2026
- Release candidate target: November 7, 2026

Attach all Sprint 1 launch issues to this milestone.

Reference: `docs/launch-plan.md`

## Issue: Verify Fresh Clone Setup

Labels: `sprint-1`, `repo-health`

Confirm a fresh clone can install and run without committed generated dependencies.

Checklist:

- Clone the repo in a clean directory.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npx expo-doctor`.
- Confirm `node_modules/`, `.expo/`, `.DS_Store`, and generated local logs are ignored.

Definition of done:

- Fresh clone setup works from only tracked source files and the lockfile.

## Issue: Confirm CI Passes on GitHub

Labels: `sprint-1`, `ci`

Confirm the GitHub Actions workflow added in `.github/workflows/ci.yml` runs on `main`.

Checklist:

- Confirm CI starts after the baseline push.
- Confirm `npm ci` succeeds.
- Confirm `npm run lint` succeeds.
- Confirm `npx tsc --noEmit` succeeds.
- Fix any GitHub-only environment or lockfile issues.

Definition of done:

- `main` shows passing CI.

## Issue: Triage Remaining Dependency Advisories

Labels: `sprint-1`, `security`, `dependencies`

Review the remaining `npm audit` advisories after non-forced fixes.

Current status:

- `npm audit fix` removed critical advisories.
- Remaining advisories require breaking Expo-related dependency changes.

Checklist:

- Re-run `npm audit --audit-level=moderate`.
- Identify which advisories affect production app runtime versus local build tooling.
- Decide whether to accept, override, patch, or defer until an Expo SDK upgrade.
- Document the decision in `docs/launch-plan.md` or a security note.

Definition of done:

- Remaining advisories have a clear launch decision.

## Issue: Decide Preview Distribution Path

Labels: `sprint-1`, `release`

Choose how pilot testers will install Clustr before public app-store launch.

Options to evaluate:

- EAS internal distribution.
- TestFlight for iOS plus internal Android APK/AAB.
- Expo preview build for a smaller technical tester group.

Definition of done:

- One distribution path is chosen and documented.

## Issue: Clean Up Stale Branches and PRs

Labels: `sprint-1`, `repo-health`

Review stale branches and PRs before launch work ramps up.

Known state:

- Open PR: `Profile page` #2
- Branches: `main`, `ammarbranch`, `loganbranch`, `mananbranch`

Checklist:

- Decide whether PR #2 is obsolete after the baseline commit.
- Close or merge stale PRs.
- Delete branches that are no longer needed.
- Protect `main` once CI is confirmed.

Definition of done:

- GitHub branch/PR state matches the current launch workflow.

## Issue: Deploy Firebase Rules to Pilot Project

Labels: `sprint-1`, `firebase`, `security`

Deploy and verify Firestore and Storage rules for the pilot Firebase project.

Project:

- `clustr-1fd1b`

Checklist:

- Run `firebase deploy --only firestore:rules`.
- Run `firebase deploy --only storage`.
- Verify authenticated UIC/invite users can read/write expected data.
- Verify blocked users cannot access campus-only data.

Definition of done:

- Firebase rules in production match the repository and pass manual access checks.

