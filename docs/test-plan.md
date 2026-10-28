# Kế hoạch kiểm thử — Kim Ngân (N1)

Nguyên tắc: **mỗi ca phải chứng minh một quy tắc nghiệp vụ (BR) hoặc một luồng
use case (UC)**. Test kiểu `assertEquals(2, 1+1)` không chứng minh gì cả.

## Kiểm thử đơn vị — mục 3.5

| Mã | Lớp | Ca kiểm thử | Chứng minh |
|---|---|---|---|
| UT-01 | OrderStateMachine | 9 chuyển tiếp hợp lệ đều đi được | §2.9.2 |
| UT-02 | OrderStateMachine | DISPENSED → bất kỳ đều ném lỗi | trạng thái kết thúc |
| UT-03 | OrderStateMachine | UNCERTAIN không tự động rời đi | BR14, NFR4.5 |
| UT-04 | CommandSigner | ký rồi kiểm lại → hợp lệ | NFR2.6 |
| UT-05 | CommandSigner | đổi một ký tự → chữ ký sai | BR7 |
| UT-06 | CommandSigner | quá 30 giây → hết hạn | BR7 |
| UT-07 | OrderService | đổi giá sau khi đặt → đơn giữ giá cũ | BR4 |
| UT-08 | InventoryService | trừ đúng số ml | BR10 |
| UT-09 | InventoryService | trừ quá số còn lại → ném lỗi | BR10 |
| UT-10 | JwtService | tăng token_version → token cũ hết hiệu lực | FR1.8 |

## Kiểm thử tích hợp — mục 3.6

| Mã | Kịch bản | Kết quả mong đợi | Truy ngược |
|---|---|---|---|
| IT-01 | luồng đầy đủ, không lỗi | DISPENSED, kho giảm đúng 1 lần | UC-05, UC-08, UC-09 |
| IT-02 | thiết bị từ chối lệnh | FAILED, có lý do, mở sự cố | BR7 |
| IT-03 | khoá an toàn chặn | FAILED, đổi trạng thái máy, sinh cảnh báo | BR8 |
| IT-04 | không có result | UNCERTAIN, không sinh lệnh thứ hai | BR14, NFR4.5 |
| IT-05 | result gửi hai lần | kho chỉ trừ một lần | NFR3.4 |
| IT-06 | máy mất heartbeat | OFFLINE, từ chối đơn mới | BR9 |
| IT-07 | BA của A đọc dữ liệu của B | nhận 404, không phải 200 | BR13, NFR2.2 |
| IT-08 | Viewer gọi API ghi dữ liệu | nhận 403 | UC-17 |
| IT-09 | webhook thanh toán gửi trùng | chỉ ghi một thanh toán | NFR3.3 |

**IT-04 và IT-05 là hai ca giá trị nhất của cả đồ án.** Nếu chỉ kịp làm hai ca
tích hợp thì làm hai ca này.

## Bảng kết quả — mục 3.7

| Mã | Ca kiểm thử | Đầu vào | Kết quả mong đợi | Kết quả thực tế | Đạt |
|---|---|---|---|---|---|
| IT-04 | Thiết bị không phản hồi (UC-08) | đơn đã thanh toán, giả lập `--fault=silent` | UNCERTAIN, không có lệnh thứ hai | | |

Ghi **đúng sự thật**. Ca nào trượt thì ghi trượt và đưa sang Chương 4 mục
Limitations. Bảng 25 ca với 23 đạt đáng tin hơn nhiều so với bảng toàn xanh.
