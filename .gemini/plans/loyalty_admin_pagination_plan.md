## Summary

Implement pagination for all relevant API endpoints in the `loyalty-admin` application using existing base pagination
mechanisms.

## Description

The `loyalty-admin` application currently lacks consistent pagination across its API endpoints that return lists of
data. This can lead to performance issues and inefficient data retrieval, especially as the dataset grows. The goal is
to integrate the existing `BasePaginationDto` and `BasePaginationResponseInterface` from the `@core/base` library into
all appropriate `loyalty-admin` API endpoints. This will standardize how pagination is handled, improve API performance
by limiting the amount of data returned, and enhance the user experience by allowing efficient browsing of large
datasets.

## Acceptance Criteria

- All API endpoints in `apps/loyalty-admin` that return a list of resources (e.g., `findAll` methods) are updated to
  accept pagination parameters.
- These endpoints correctly utilize the `BasePaginationDto` for input parameters (page, size, search, sort, order).
- The corresponding service methods implement the pagination logic, applying `skip`, `take`, `order by`, and `where`
  clauses based on the `BasePaginationDto` parameters.
- API responses for paginated endpoints conform to the `BasePaginationResponseInterface`, including `page`, `total`,
  `size`, and the paginated `data` array.
- Existing unit and integration tests are updated, and new tests are added to cover the pagination functionality for
  each modified endpoint.
- Performance is not degraded, and ideally, improved for large datasets.

## Proposed Sub-tasks

- [x] Task 1: Identify all `findAll` or list-returning API endpoints within `apps/loyalty-admin` that require
  pagination.
- [x] Task 2: For each identified endpoint, modify the controller method to accept `BasePaginationDto` as query
  parameters.
- [x] Task 3: Update the corresponding service methods to receive and apply the pagination parameters (page, size,
  search, sort, order) when querying the database.
- [x] Task 4: Ensure the service methods return data in a format compatible with `BasePaginationResponseInterface`,
  including total count.
- [x] Task 5: Implement or adjust database queries (e.g., using TypeORM's `skip`, `take`, `order`, `where` options) to
  support pagination.
- [ ] Task 6: Create or update unit and integration tests for each paginated endpoint to verify correct pagination
  behavior.

## Anticipated Challenges & Considerations

- Ensuring backward compatibility for existing API consumers if the pagination implementation introduces breaking
  changes to endpoint signatures or response structures.
- Handling complex search and filtering requirements in conjunction with pagination.
- Optimizing database queries for performance, especially for large tables and complex sorting criteria.
- Consistent application of pagination across all relevant endpoints to avoid discrepancies.
- Potential need for custom sorting logic if default TypeORM sorting is insufficient for specific fields.