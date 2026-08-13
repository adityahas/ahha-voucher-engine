# Seed Ten Synthetic Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create ten synthetic reward records through the CMS reward creation UI using Playwright.

**Architecture:** Use the existing CMS at `http://localhost:5173`, authenticate with its default login values when required, and interact with `/rewards/create` through Playwright UI locators. Resolve an existing valid reward source before submission, optionally select available tiers, submit one record at a time, and verify the final rewards list.

**Tech Stack:** Playwright, React/Vite CMS, existing reward API and browser session.

## Global Constraints

- Do not modify application source, tests, or database schema.
- Use the CMS UI for every reward creation; do not replace the flow with direct curl/API calls.
- Do not retry a failed submission automatically.
- Do not modify or delete existing rewards.
- Stop on authentication failure, missing reward source, failed submission, or unexpected validation response.
- Use unique names exactly as listed in the approved design.

---

### Task 1: Create and verify ten synthetic rewards through Playwright

**Files:**

- Read: `e2e/playwright.config.ts`
- Read: `apps/frontend-cms/src/components/RewardForm.tsx`
- Read: `apps/frontend-cms/src/pages/RewardCreate.tsx`
- Read: `apps/frontend-cms/src/api/rewards.ts`
- No application files created or modified.

**Interfaces:**

- Consumes: CMS route `/rewards/create`, login defaults, existing reward source data, and available minimum-tier options.
- Produces: Ten persisted rewards with the approved synthetic names and a Playwright verification result.

- [ ] **Step 1: Confirm the local CMS and API are reachable**

Run:

```bash
curl -I --max-time 10 http://localhost:5173/rewards/create
curl -I --max-time 10 http://localhost:8080/loyalty-admin/reward-item
```

Expected: The CMS responds, and the API responds with an HTTP status rather than a connection failure. Do not continue if either service is unreachable.

- [ ] **Step 2: Open the CMS in Playwright and complete default login if shown**

Use the existing browser automation skill/tooling to navigate to `http://localhost:5173/rewards/create`. If a login form is displayed, use the application's default login values already configured for the local CMS. Verify that the page heading `Create Reward` is visible before entering data.

- [ ] **Step 3: Resolve a valid reward source and inspect tiers**

Use the UI's `Source ID` field and the existing reward-source data available to the authenticated tenant. Use an existing valid source UUID, not a generated UUID. Inspect the `Minimum Tier` select options. Record the available tier IDs and names for use by tiered rows. If no valid source can be resolved, stop and report the blocker without submitting any reward.

- [ ] **Step 4: Submit the approved dataset one reward at a time**

For each row below, fill the fields by their labels, use the resolved source ID, select the requested tier when that tier position exists, and submit:

| #   | Name                             | Type         | Stock | Point Price | Exclusive Days | Tier selection        |
| --- | -------------------------------- | ------------ | ----: | ----------: | -------------: | --------------------- |
| 1   | GoPay 10K Synthetic 01           | gopay        |    25 |        1000 |              0 | No minimum            |
| 2   | GoPay 25K Synthetic 02           | gopay        |    20 |        2500 |              1 | First available tier  |
| 3   | Pulsa Telkomsel 10K Synthetic 03 | pulsa        |    30 |        1200 |              0 | No minimum            |
| 4   | Pulsa XL 25K Synthetic 04        | pulsa        |    18 |        2800 |              3 | Second available tier |
| 5   | Voucher Kopi Synthetic 05        | voucher      |    15 |        1500 |              0 | No minimum            |
| 6   | E-Wallet 50K Synthetic 06        | ewallet      |    10 |        5000 |              7 | Third available tier  |
| 7   | Data 5GB Synthetic 07            | data         |    40 |        2200 |              1 | No minimum            |
| 8   | Streaming 30 Hari Synthetic 08   | subscription |    12 |        4500 |              3 | First available tier  |
| 9   | Game Credit 20K Synthetic 09     | game         |    22 |        2000 |              0 | No minimum            |
| 10  | Belanja 100K Synthetic 10        | voucher      |     8 |        9000 |              7 | Second available tier |

After each submit, wait for navigation to `/rewards` and verify the submitted name is visible in the list. Return to `/rewards/create` for the next row. If no tier option exists for a requested tier, choose `No minimum tier` for that row and continue. If a submission fails, stop immediately, capture the visible error and failed name, and do not retry.

- [ ] **Step 5: Verify the final list contains all ten names**

On `/rewards`, assert that all ten exact names are visible:

```text
GoPay 10K Synthetic 01
GoPay 25K Synthetic 02
Pulsa Telkomsel 10K Synthetic 03
Pulsa XL 25K Synthetic 04
Voucher Kopi Synthetic 05
E-Wallet 50K Synthetic 06
Data 5GB Synthetic 07
Streaming 30 Hari Synthetic 08
Game Credit 20K Synthetic 09
Belanja 100K Synthetic 10
```

Expected: all ten names are present and no submission reported an error.

- [ ] **Step 6: Report execution evidence without committing runtime artifacts**

Report the ten created names, source ID used, tier selections actually available, final URL, and any captured screenshots or errors. Do not add Playwright scripts, screenshots, traces, or generated files to git unless explicitly requested.

## Verification Checklist

- [ ] CMS reachable.
- [ ] Authentication completed with default values if required.
- [ ] Valid existing reward source resolved.
- [ ] Ten UI submissions succeeded.
- [ ] Each submission redirected to `/rewards`.
- [ ] All ten exact names visible in the final list.
- [ ] No application files changed.
