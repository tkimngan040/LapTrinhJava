# Tài liệu đồ án ScentStation

## Cách dùng

**Mỗi tuần, mỗi người** mở file `nhat-ky/tuan-0X.md`, tìm tên mình, điền 4 mục:
đã làm gì, kết quả (kèm ảnh), khó khăn, còn tồn đọng. Mất khoảng 10 phút.

Làm ngay trong tuần, đừng để dồn. Tuần 8 chỉ còn việc ráp lại thành báo cáo.

## Quy trình nộp

1. Tạo nhánh: `git checkout -b docs/tuan-0X-ten-ban`
2. Sửa file, thêm ảnh vào `anh/`
3. `git add . && git commit -m "docs: nhật ký tuần X - Tên"`
4. Push rồi mở Pull Request, nhóm trưởng merge

Sửa trực tiếp trên web GitHub cũng được: mở file, bấm biểu tượng bút chì,
sửa xong chọn "Create a new branch and start a pull request".

## Cấu trúc

```
docs/
├── nhat-ky/      nhật ký 8 tuần — CẢ NHÓM điền hàng tuần
├── bao-cao/      các chương báo cáo — Trà My & Kim Tuyền biên tập ở tuần 8
└── anh/          ảnh chụp màn hình
```

## Xuất ra file Word

Cài [pandoc](https://pandoc.org/installing.html) rồi chạy:

```bash
pandoc bao-cao/*.md -o bao-cao-scentstation.docx
```

Nếu trường có mẫu Word riêng, dùng mẫu đó làm khuôn:

```bash
pandoc bao-cao/*.md --reference-doc=mau-truong.docx -o bao-cao-scentstation.docx
```

## Quy ước đặt tên ảnh

`tuan0X-ten-noi-dung.png` — ví dụ `tuan02-swagger-api-brand.png`
