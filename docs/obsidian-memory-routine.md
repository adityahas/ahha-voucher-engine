# Obsidian Memory — Weekly Synthesis Routine (Paperclip)

> Konfigurasi routine Paperclip untuk menjaga `~/ObsidianVault` tetap segar: konsolidasi
> daily notes → fakta PARA, decay fakta dingin, update `index.md`.

## Kendala eksekusi

Env Paperclip (`PAPERCLIP_API_URL`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_AGENT_ID`,
`PAPERCLIP_API_KEY`) **hanya tersedia saat heartbeat** — routine tidak bisa dibuat dari sesi
opencode interaktif. Dokumen ini berisi payload lengkap yang tinggal dieksekusi dari dalam
heartbeat/board.

## Identitas

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Company ID     | `cd4450b3-7fab-42d3-9363-0c0a8bf102ce` (Ahha) |
| Assignee agent | CTO — `7b7d212b-1719-4ec0-a0e2-23aea0da8707`  |
| Project        | project Ahha Voucher Engine                   |
| Schedule       | `0 9 * * 1` (Senin 09:00, Asia/Jakarta)       |
| Concurrency    | `coalesce_if_active`                          |
| Catch-up       | `skip_missed`                                 |

## Payload pembuatan routine

```
POST /api/companies/{companyId}/routines
{
  "title": "Weekly memory synthesis — Obsidian vault",
  "description": "Konsolidasi daily notes ke fakta PARA di ~/ObsidianVault, decay fakta dingin, update index.md (MOC).",
  "assigneeAgentId": "7b7d212b-1719-4ec0-a0e2-23aea0da8707",
  "projectId": "{projectId}",
  "priority": "low",
  "status": "active",
  "concurrencyPolicy": "coalesce_if_active",
  "catchUpPolicy": "skip_missed"
}
```

Lalu tambah trigger schedule:

```
POST /api/routines/{routineId}/triggers
{
  "kind": "schedule",
  "cronExpression": "0 9 * * 1",
  "timezone": "Asia/Jakarta"
}
```

## Instruksi isi issue run (untuk agent CTO)

Ketika routine memicu run, ikuti langkah ini (memakai skill `obsidian-memory` + MCP
`obsidian_*` tools):

1. **Baca MOC**: `obsidian_get_note` pada `~/ObsidianVault/index.md`.
2. **Konsolidasi daily notes**:
   - Scan `~/ObsidianVault/daily/*.md` (via `obsidian_list_notes`).
   - Untuk fakta durable yang muncul di daily notes minggu ini, pindahkan/salin ke file PARA
     yang sesuai: `Areas/people/<name>.md`, `Areas/companies/<name>.md`,
     `Projects/<name>.md`, `Resources/<topic>.md`.
   - Gunakan dedup: `obsidian_get_note` sebelum menulis; append bila sudah ada.
3. **Decay fakta dingin**: fakta yang tidak direferensikan ≥ 30 hari dihapus dari file PARA
   utama dan dipindah ke `Archive/` (jangan dihapus permanen).
4. **Update index.md**: tambahkan link proyek aktif baru ke section "Active projects";
   pastikan section "Recent daily notes" menunjuk minggu terakhir.
5. **Tandai issue done** dengan ringkasan sintesis yang dilakukan.
