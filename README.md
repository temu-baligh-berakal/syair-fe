# Syair Front-End Reposiotry

### Anggota Kelompok
* Muhammad Raihan Maulana - 2306216636
* Muhammad Rafli Eda Pradana - 2306207480
* Raden Ahmad Yasin Mahendra - 2306215154

# Laporan Milestone 1

Pada Milestone 1 ini, kami telah mengembangkan **Syair**, sebuah aplikasi mesin pencari hadits antarmuka (*front-end*) yang berfokus pada penerapan teknik Temu Balik Informasi (TBI) / *Information Retrieval* guna mengekstraksi dan menyajikan hasil dengan cepat, relevan, dan efisien.

Berikut adalah rincian fitur-fitur yang telah kami implementasikan:

### 🔍 Fitur Utama
Aplikasi kami terintegrasi dengan klaster **OpenSearch** sebagai ruang penyimpanan (*index*) dan penggerak utama dalam pemrosesan kueri. Untuk menjawab berbagai kebutuhan *user intent*, kami menyediakan 3 *mode* pencarian:
1. **BM25 (Lexical Search):** Pencarian teks yang didasarkan pada kecocokan leksikal (*keyword matching*). Berguna ketika pengguna memasukkan kueri yang sangat spesifik dan mengharapkan *exact match* atas frasa yang sama dengan dokumen hadits aslinya.
2. **KNN (Semantic/Vector Search):** Pencarian semantik menggunakan pendekatan *K-Nearest Neighbors* atas ruang vektor komputasi (*Vector Embeddings*). Memungkinkan sistem memahami maksud konteks kalimat pengguna secara implisit, meskipun kata yang dicari tidak sama persis atau berupa bahasa bebas (pertanyaan).
3. **Hybrid Search:** Menggunakan teknik fusion atau gabungan atas metrik pembobotan skor antara sistem sintaksis BM25 dan kalkulasi pemahaman semantik dari KNN untuk menyajikan relevansi puncak (*Search Relevance*) terbaik.

### ✨ Fitur Pendukung & Kecerdasan Buatan (UX/AI)
Untuk menjembatani fungsionalitas kompleks dari algoritma pencarian di atas, kami merancang berbagai *tools* interaktif pendukung pada antarmuka:
* **AI Summary (Rangkuman Otomatis):** Aplikasi secara otomatis menyuntikkan dokumen deretan 10 hadits teratas ke dalam sebuah Large Language Model (LLM) untuk ditarik kesimpulan dan ringkasannya yang mana akan membantu pengguna memperoleh intisari jawaban dengan instan.
* **Autocompletion & Query Suggestion:** Memberikan prediksi dan saran pencarian hadits secara responsif dan *real-time* selama pengguna mengetikkan karakter di dalam *search bar* utama.
* **Typo Tolerance suggestion:** Saat sistem merasa query tidak memiliki struktur dokumen hasil yang kuat, sistem menavigasi ke query yang lebih disarankan.
* **Filter Pagination & Facet:** Memberikan fleksibilitas eksplorasi bagi pencari dengan sistem *prev-next* maupun dengan mengerucutkan batas pencarian hanya pada kategori *Perawi* (Narator) tertentu.