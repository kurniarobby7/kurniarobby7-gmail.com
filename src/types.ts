export interface VisitData {
  id?: number;
  visitNumber?: string;
  namaLengkap: string;
  nik?: string;
  instansi: string;
  jabatan: string;
  noHp: string;
  email: string;
  alamat: string;
  keperluan: string;
  keteranganLainnya?: string;
  tujuanBertemu: string;
  bidangTujuan: string;
  jumlahPengunjung: number | string;
  tanggalKunjungan?: string;
  jamDatang?: string;
  signatureUrl?: string; // canvas datal URL Base64
  photoUrl?: string; // webcam photo data URL Base64
  documentUrl?: string;
  syncedToSheets?: number;
  createdAt?: string;
}
