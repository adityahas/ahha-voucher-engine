# Reward Item Source CRUD Design

## Goal

Enable admins to manage Reward Item Sources through the CMS and select an
existing source when creating or editing rewards. This also fixes the backend
DTO/entity mismatch that currently prevents source creation.

## Chosen Approach

Implement full CRUD end-to-end:

- Align backend DTOs and UUID deletion with the `RewardItemSourceEntity`.
- Make provider `apiKey` optional so synthetic sources do not require a real
  provider credential.
- Add authenticated CMS list, create, edit, and delete pages.
- Mask API keys in API responses and CMS lists/details; allow show/hide only for
  plaintext entered into the current form before submission.
- Replace the reward form's manual Source ID input with a source dropdown while
  continuing to submit `source_id` in the reward payload.

## Backend Contract

The existing routes remain:

```text
GET    /loyalty-admin/reward-item-source?page=0&size=100
GET    /loyalty-admin/reward-item-source/:id
POST   /loyalty-admin/reward-item-source
PATCH  /loyalty-admin/reward-item-source/:id
DELETE /loyalty-admin/reward-item-source/:id
```

Create and update fields:

```json
{
  "name": "Synthetic Reward Provider",
  "source_type": "synthetic",
  "api_endpoint": "https://example.com/rewards",
  "apiKey": "optional-provider-secret"
}
```

Validation rules:

- `name`: required non-empty string.
- `source_type`: required non-empty string.
- `api_endpoint`: optional valid URL.
- `apiKey`: optional string; empty input is treated as null.

`UpdateRewardItemSourceDto` remains a partial DTO. The delete controller passes
the UUID string to the service rather than coercing it to a number.

The entity's `apiKey` column becomes nullable. Responses from list, detail,
create, and update expose only a masked value. The masking rule preserves at
most the first three and last three characters, using `***` for the middle;
shorter values are represented as `***`. No endpoint in this feature returns
the stored plaintext API key.

## CMS Architecture

Add an API module for source operations using the existing auth headers:

- `getRewardSources()`
- `getRewardSource(id)`
- `createRewardSource(input)`
- `updateRewardSource(id, input)`
- `deleteRewardSource(id)`

Add these authenticated routes:

- `/reward-sources`: list page with name, type, endpoint, masked API key, and
  edit/delete actions.
- `/reward-sources/create`: create form.
- `/reward-sources/:id/edit`: edit form.

The form contains name, source type, endpoint, and API key. The API key input
is masked by default and has a show/hide control for the value currently being
typed. Existing masked API keys are not loaded as editable plaintext; editing
leaves the key unchanged unless a new key is explicitly entered.

Add a `Reward Sources` navigation item under the Loyalty section. Delete uses a
confirmation dialog, waits for the API response, and refreshes the list only
after success. API and validation errors are shown inline or in the page error
state; deletion is not optimistic.

Update `RewardForm` to fetch sources and render a required source dropdown with
source name and type. The selected source ID remains the `source_id` property
sent to the reward API. If no sources exist, show an actionable empty state
linking to `/reward-sources/create` rather than requiring a UUID to be typed.

## Data Flow

1. CMS authenticates and stores the existing tenant headers and token.
2. Source list page requests paginated sources from the loyalty-admin API.
3. Create/edit form sends validated source fields to the backend.
4. Backend persists the source and returns metadata with a masked API key.
5. Reward create/edit fetches source options and sends only the selected UUID as
   `source_id`.
6. Delete waits for backend success before removing the row from the visible
   list.

## Error Handling and Security

- Backend rejects unknown DTO fields under the existing `forbidNonWhitelisted`
  validation configuration.
- Backend validates URL format and required source fields.
- Missing or invalid authentication is handled consistently with existing CMS
  API clients.
- Plaintext API keys are never rendered in list/detail responses or persisted in
  frontend state after a response.
- Existing source records are not modified except through explicit user action.
- Delete failures leave the row visible and show the returned error.

## Testing

Backend tests cover DTO validation, nullable API keys, masked response values,
UUID deletion, and CRUD service behavior. CMS tests cover API request payloads,
source form validation and masking, list rendering, delete confirmation/error,
and RewardForm source selection. Verification includes the loyalty-admin build,
CMS type-check, and relevant Jest/Vitest suites.

## Success Criteria

- An admin can create, view, edit, and delete a Reward Item Source in CMS.
- Sources with no provider API key can be created successfully.
- API keys are never returned in plaintext.
- Reward creation no longer requires manually entering a source UUID.
- Existing reward and source records remain unaffected until explicitly edited
  or deleted.
