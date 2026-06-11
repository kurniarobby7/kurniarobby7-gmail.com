import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, date, time } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const visits = pgTable('visits', {
  id: serial('id').primaryKey(),
  visitNumber: text('visit_number').notNull().unique(), // e.g. BPMP-20231012-001
  namaLengkap: text('nama_lengkap').notNull(),
  nik: text('nik'), // opsional
  instansi: text('instansi').notNull(),
  jabatan: text('jabatan').notNull(),
  noHp: text('no_hp').notNull(),
  email: text('email').notNull(),
  alamat: text('alamat').notNull(),
  keperluan: text('keperluan').notNull(),
  keteranganLainnya: text('keterangan_lainnya'),
  tujuanBertemu: text('tujuan_bertemu').notNull(),
  bidangTujuan: text('bidang_tujuan').notNull(),
  jumlahPengunjung: integer('jumlah_pengunjung').notNull(),
  tanggalKunjungan: date('tanggal_kunjungan').notNull(), // defaults to current date in insert
  jamDatang: time('jam_datang').notNull(), // defaults to current time in insert
  signatureUrl: text('signature'), // canvas data url
  photoUrl: text('photo_url'), // webcam photo data url
  documentUrl: text('document_url'), // optional
  syncedToSheets: integer('synced_to_sheets').default(0), // 0: false, 1: true
  createdAt: timestamp('created_at').defaultNow(),
});
