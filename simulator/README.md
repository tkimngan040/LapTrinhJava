# simulator — trình giả lập thiết bị kiosk

Đây là **tầng thiết bị** của hệ thống, không phải đồ thay thế tạm (§1.5.3, §2.8.1).

Chạy: `java -jar target/simulator.jar --device=KIOSK-001 --fault=none`

| File | Chủ sở hữu | Task |
|---|---|---|
| `KioskSimulator.java`, `CommandVerifier.java`, `SafetyInterlock.java` | Long | L4 |
| `FaultInjector.java` | Kim Ngân | N2 |
| `Topics.java` (chép y hệt từ backend) | Long | L5 |

## Sáu chế độ chạy

| Tham số | Giả lập làm gì | Backend phải ra |
|---|---|---|
| `--fault=none` | chạy bình thường | DISPENSED |
| `--fault=reject` | từ chối lệnh ở ack | FAILED + mở sự cố |
| `--fault=interlock` | báo cửa đang mở | FAILED + cập nhật trạng thái máy |
| `--fault=silent` | nhận lệnh, không gửi result | UNCERTAIN, không có lệnh thứ hai |
| `--fault=duplicate` | gửi result hai lần | kho chỉ trừ một lần |
| `--fault=offline` | ngừng phát heartbeat | máy OFFLINE, từ chối đơn mới |
