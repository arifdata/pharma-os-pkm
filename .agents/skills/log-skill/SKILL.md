---
name: log-skill
description: Deskripsikan log yang sudah dikerjakan
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
---

## What I do

- Tambahkan log yang sudah dikerjakan di file progress.txt

## When to use me

- Setelah selesai membuat file, refactor, atau memperbaiki bug
- Setiap kali ada perubahan kode

## How I do it

1. Read `progress.txt` untuk melihat log terakhir
2. Append entry baru di bagian bawah file
3. Grup berdasarkan tanggal, gunakan bullet points
4. Format: aksi (`Modified`, `Created`, `Fixed`, `Deleted`) + nama file + deskripsi

## Log Format

```

## 2026-05-24

### Kategori Task
- Modified `dir/file.extension` - Modified the bla bla bla
- Created `dir/file.extension` - New file for bla bla bla
- Fixed `dir/file.extension` - Fixed error bla bla bla

**PENTING:** Selalu append, jangan overwrite file yang sudah ada.
