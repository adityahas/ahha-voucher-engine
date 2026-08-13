# Seed Ten Synthetic Rewards Through Playwright

## Goal

Create ten synthetic reward records through the CMS reward creation UI at
`http://localhost:5173/rewards/create`, using Playwright and the application's
default login values. This validates the complete login, form, API, redirect,
and list flow without changing application code.

## Chosen Approach

Use Playwright UI interaction, one reward at a time. For each record, open the
create page, fill the visible fields, select a minimum tier when available,
submit, and verify the redirect to `/rewards`. This is preferred over direct
API calls because it exercises the actual CMS form and its numeric input
coercion.

## Synthetic Dataset

| #   | Name                             | Type         | Stock | Point Price | Exclusive Days | Minimum Tier |
| --- | -------------------------------- | ------------ | ----: | ----------: | -------------: | ------------ |
| 1   | GoPay 10K Synthetic 01           | gopay        |    25 |        1000 |              0 | No minimum   |
| 2   | GoPay 25K Synthetic 02           | gopay        |    20 |        2500 |              1 | Tier first   |
| 3   | Pulsa Telkomsel 10K Synthetic 03 | pulsa        |    30 |        1200 |              0 | No minimum   |
| 4   | Pulsa XL 25K Synthetic 04        | pulsa        |    18 |        2800 |              3 | Tier second  |
| 5   | Voucher Kopi Synthetic 05        | voucher      |    15 |        1500 |              0 | No minimum   |
| 6   | E-Wallet 50K Synthetic 06        | ewallet      |    10 |        5000 |              7 | Tier third   |
| 7   | Data 5GB Synthetic 07            | data         |    40 |        2200 |              1 | No minimum   |
| 8   | Streaming 30 Hari Synthetic 08   | subscription |    12 |        4500 |              3 | Tier first   |
| 9   | Game Credit 20K Synthetic 09     | game         |    22 |        2000 |              0 | No minimum   |
| 10  | Belanja 100K Synthetic 10        | voucher      |     8 |        9000 |              7 | Tier second  |

The `Source ID` field will use a valid existing reward source ID selected from
the application's available data. If the app requires a manually entered UUID
and no source can be resolved, execution stops rather than creating invalid
records. If no minimum tier is available in the dropdown, tiered records fall
back to no minimum tier so all ten records can still be created.

## Flow and Verification

1. Navigate to the CMS and use default login values if authentication is shown.
2. Navigate to `/rewards/create`.
3. Resolve a valid reward source and inspect available minimum tiers.
4. Fill each reward's name, type, source ID, stock, point price, exclusive
   days, and optional minimum tier.
5. Submit and wait for the successful navigation to `/rewards`.
6. Confirm the created reward is present in the list before continuing.
7. At the end, confirm all ten unique synthetic names are present.

## Error Handling

- Stop on authentication failure, missing source data, failed submission, or
  unexpected validation response.
- Record the failed reward name and visible/API error.
- Do not retry a submission automatically, preventing duplicate records.
- Existing records are not modified or deleted.

## Scope and Success Criteria

This is an execution-only task. No application source or test code is changed.
Success means all ten unique rewards are created through the UI, each submit
returns successfully, the CMS redirects to the reward list, and the final list
contains all ten names.
