# Ai commit vào đâu

Mở file này trước khi tạo file mới. Nếu phải sửa file trong vùng của người khác,
nhắn nhóm trước — đừng sửa thẳng rồi để người ta phát hiện lúc merge.

| Thư mục | Chủ sở hữu | Vai |
|---|---|---|
| `backend/src/main/.../security/`, `config/`, `common/` | **Long** | BE-lõi |
| `backend/src/main/.../domain/order/`, `domain/dispensing/`, `iot/` | **Long** | BE-lõi |
| `backend/src/main/.../domain/brand/`, `user/`, `inventory/`, `alert/`, `maintenance/`, `audit/`, `report/` | **Hoài Anh** | BE-nghiệp vụ |
| `backend/src/main/.../domain/catalog/` | **Trà My** | CSDL |
| `backend/src/main/resources/db/migration/` | **Trà My** | CSDL |
| mọi file `*Entity.java` và `*Repository.java` | **Trà My** | CSDL |
| `simulator/` | **Long** (phần lõi) + **Kim Ngân** (FaultInjector) | |
| `frontend/` | **Kim Tuyến** | FE |
| `backend/src/test/` | **Kim Ngân** | Tester |
| `docs/test-plan.md` | **Kim Ngân** | Tester |
| `docs/api-contract.md` | **cả nhóm** — ai đổi thì nhắn | |
| `Report/03.Implementation and Testing.md` | 3.1 Trà My · 3.2 Long · 3.3 Hoài Anh · 3.4 Kim Tuyến · 3.5–3.7 Kim Ngân | |
| `Report/Diagram_image/Ch3/` | **Kim Tuyến** | ảnh mục 3.4 |
| `Work Log/` | mỗi người file của mình | |

## Quy tắc tránh xung đột

Trong một package nghiệp vụ có hai người cùng làm việc: Trà My viết Entity và
Repository, người chủ package viết Service và Controller. Khác file nên git
không bao giờ xung đột.

## Nhánh và pull request

```bash
git checkout main && git pull
git checkout -b feat/long-SCENT-12-jwt     # feat/<tên>-<mã Jira>-<việc>
# ... code ...
git add . && git commit -m "feat(security): dang nhap JWT va phan quyen 7 vai tro"
git push -u origin feat/long-SCENT-12-jwt
```

Mở Pull Request trên GitHub, một người review rồi mới merge vào `main`.
Không push thẳng lên `main`.

Tiền tố commit: `feat:` chức năng mới · `fix:` sửa lỗi · `docs:` tài liệu ·
`test:` kiểm thử · `chore:` việc vặt.

Lịch sử commit sạch cũng là bằng chứng cho Chương 4 về cách nhóm làm việc.
