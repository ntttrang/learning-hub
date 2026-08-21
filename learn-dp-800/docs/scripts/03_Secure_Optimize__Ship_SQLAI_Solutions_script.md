# Kịch bản thuyết trình (Tiếng Việt)
## Secure, Optimize, & Ship SQL+AI Solutions — DP-800

> Ghi chú: Các thuật ngữ kỹ thuật, tên hàm T-SQL và tên dịch vụ Azure được giữ nguyên tiếng Anh. Phần lời dẫn bằng tiếng Việt để trình bày tự nhiên.

---

### Slide 1 — Trang bìa: Secure, Optimize, & Ship SQL+AI Solutions

Xin chào mọi người, chào mừng đến với phần cuối cùng trong loạt ba buổi chuẩn bị chứng chỉ DP-800. Nếu ở hai buổi trước chúng ta đã nói về việc thiết kế đối tượng database và đưa AI vào SQL, thì hôm nay chúng ta sẽ tập trung vào việc bảo mật, tối ưu hóa hiệu năng, và triển khai các giải pháp SQL+AI vào production một cách chuyên nghiệp.

---

### Slide 2 — Mục lục (Table of Contents)

Nội dung hôm nay gồm 4 module:

Module 1 — Implement Data Security & Compliance with SQL: triển khai bảo mật dữ liệu và tuân thủ với SQL.

Module 2 — Optimize Database Performance: tối ưu hóa hiệu năng database.

Module 3 — Implement CI/CD with SQL Database Projects: triển khai CI/CD với SQL Database Projects.

Module 4 — Integrate SQL Solutions with Azure Services: tích hợp các giải pháp SQL với dịch vụ Azure.

---

### Slide 3 — Module 1: Implement Data Security & Compliance with SQL

Bắt đầu với Module 1: Triển khai bảo mật dữ liệu và tuân thủ với SQL. Chúng ta sẽ học cách bảo vệ dữ liệu nhạy cảm và đáp ứng các yêu cầu tuân thủ thông qua mã hóa, che dữ liệu (masking), kiểm soát truy cập, và audit trên các nền tảng SQL của Microsoft.

---

### Slide 4 — Data Encryption Strategies

Về chiến lược mã hóa dữ liệu, chúng ta cần bảo vệ dữ liệu cả khi lưu trữ (at rest) lẫn khi đang sử dụng (in use), với cách tiếp cận phù hợp cho từng tình huống.

**Always Encrypted**: mã hóa phía client — dữ liệu không bao giờ hiển thị dạng plaintext trên server. Nó bảo vệ dữ liệu ngay cả khỏi DBA, sysadmin, và nhà vận hành cloud. Kiến trúc gồm Column Master Key (CMK) và Column Encryption Key (CEK). Mã hóa deterministic hỗ trợ equality join và GROUP BY; mã hóa randomized bảo mật mạnh hơn nhưng không hỗ trợ các phép toán truy vấn. Secure enclave cho phép thực hiện range query và pattern matching ngay trên dữ liệu đã mã hóa. Ứng dụng: số an sinh xã hội, thẻ tín dụng, hồ sơ y tế, dữ liệu tài chính.

**Column-Level Encryption**: mã hóa phía server dùng symmetric key và certificate. Dữ liệu được mã hóa/giải mã ngay trong engine của SQL Server. Việc quản lý key đơn giản hơn Always Encrypted, nhưng ranh giới tin cậy (trust boundary) khác — server có thể thấy plaintext trong lúc xử lý. Dùng các hàm `EncryptByKey()` / `DecryptByKey()`. Hệ thống phân cấp certificate: Service Master Key > Database Master Key > Certificate > Symmetric Key. Phù hợp khi chỉ cần bảo vệ dữ liệu lúc lưu trữ và việc tin tưởng server là chấp nhận được.

Luồng dữ liệu minh họa: từ Database client (plaintext) → qua SQL client driver → đến Database engine → qua Secure enclave (chuyển từ ciphertext sang plaintext) → đến SQL DLL.

---

### Slide 5 — Understand Encryption Layers

Chúng ta có thể hình dung các lớp mã hóa như một hệ thống phòng thủ nhiều tầng:

Lớp ngoài cùng là **Always Encrypted (Client Side)** — key mã hóa được giữ bên ngoài database.

Lớp tiếp theo là **Column-Level Encryption** — mã hóa các cột cụ thể ngay trong SQL.

Lớp trong cùng là **TDE — Transparent Data Encryption** (ở cấp file database) — mã hóa toàn bộ file database.

Đây chính là phòng thủ theo lớp (layered defense): mỗi lớp thu hẹp dần phạm vi ai có thể nhìn thấy dữ liệu dạng plaintext — từ ứng dụng client cho đến tận file database vật lý.

---

### Slide 6 — Dynamic Data Masking & Row-Level Security

**Dynamic Data Masking (DDM)** giúp kiểm soát những gì người dùng nhìn thấy mà không thay đổi dữ liệu gốc được lưu trữ. Có 4 loại mask function: **Default** — dùng `FUNCTION = 'default()'`, kết quả là `xxxx` hoặc `0`; **Email** — dùng `FUNCTION = 'email()'`, kết quả dạng `aXXX@XXXX.com`; **Random** — dùng `FUNCTION = 'random(1,100)'`, trả về một số ngẫu nhiên; **Partial** — dùng `FUNCTION = 'partial(2,"XX",1)'`, kết quả dạng `abXXe`.

Lưu ý quan trọng: DDM là kỹ thuật che khuất (obfuscation), KHÔNG phải mã hóa. Mục đích của nó là giảm công sức phát triển. Người dùng có quyền `UNMASK` và những người dùng đặc quyền như sysadmin vẫn nhìn thấy dữ liệu thật.

**Row-Level Security (RLS)**: gồm **Filter Predicate** — âm thầm lọc các dòng khỏi kết quả SELECT, UPDATE, DELETE; **Block Predicate** — chặn các thao tác INSERT hoặc UPDATE vi phạm chính sách; **Security Function** — là một inline table-valued function trả về 1 (cho phép) hoặc 0 (từ chối); **Security Policy** — gắn hàm predicate vào một hoặc nhiều bảng.

Mẫu thường dùng: dùng `SESSION_CONTEXT()` hoặc `USER_NAME()` trong hàm predicate để lọc theo người dùng đang đăng nhập.

---

### Slide 7 — Object-Level Permissions & Secure Access

Chúng ta cần triển khai các mẫu truy cập theo nguyên tắc đặc quyền tối thiểu (least-privilege) trên các đối tượng database và các kết nối dịch vụ.

**Permission Hierarchy (Phân cấp quyền)**: `GRANT` / `DENY` / `REVOKE` có thể áp dụng ở cấp server, database, schema, và object. Ở cấp schema: `GRANT SELECT ON SCHEMA::Sales TO [AnalystRole]`. Ở cấp object: `GRANT EXECUTE ON dbo.usp_GetOrders TO [AppRole]`. Lưu ý: `DENY` luôn thắng `GRANT` trong việc xác định quyền cuối cùng. Nên dùng database role để nhóm quyền, thay vì cấp quyền cho từng user riêng lẻ. Các fixed role có sẵn: `db_datareader`, `db_datawriter`, `db_ddladmin`. Có thể tạo custom role bằng `CREATE ROLE [OrderProcessor]` để kiểm soát chi tiết hơn. Nguyên tắc chung: chỉ cấp quyền tối thiểu cần thiết cho từng chức năng.

**Modern Secure Access (Truy cập bảo mật hiện đại)**: Passwordless Authentication — dùng xác thực Microsoft Entra ID thay vì SQL auth với mật khẩu lưu trữ; Managed Identity — dùng identity hệ thống hoặc user-assigned để truy cập giữa các dịch vụ mà không cần credential trong code; Secure Model Endpoints — dùng Managed Identity để xác thực khi gọi endpoint của AI model từ SQL; Secure API Endpoints — bảo vệ các endpoint GraphQL, REST, và MCP bằng xác thực, phân quyền, và audit.

---

### Slide 8 — Auditing & Compliance

Chúng ta cần thu thập bằng chứng tuân thủ thông qua audit trail toàn diện trên tất cả các nền tảng SQL.

**SQL Server Audit**: có audit spec ở cấp server và cấp database, ghi vào Event Log hoặc file target. Các nhóm audit gồm `BATCH_COMPLETED`, `LOGIN_CHANGE`, `SCHEMA_OBJECT_ACCESS`. Có thể chọn nhóm hành động chi tiết theo từng đối tượng database, và kết hợp với Extended Events để chẩn đoán.

**Azure SQL Auditing**: có tính năng audit tích hợp sẵn, ghi vào Blob Storage hoặc Log Analytics. Tự động ghi lại mọi thao tác DML và DDL. Tích hợp với Microsoft Defender for SQL để phát hiện đe dọa — như SQL injection, truy cập bất thường. Thời gian lưu trữ mặc định 90 ngày, có thể cấu hình tới nhiều năm.

**Compliance Features (Tính năng tuân thủ)**: phân loại dữ liệu (data classification) với nhãn độ nhạy cảm trên các cột; vulnerability assessment — quét bảo mật tự động; cảnh báo Advanced Threat Protection; Azure Policy để thực thi tiêu chuẩn audit; và cung cấp bằng chứng tuân thủ cho GDPR, HIPAA, SOC 2.

---

### Slide 9 — Security Decision Guide

Đây là bảng hướng dẫn ra quyết định bảo mật, chọn đúng công cụ dựa trên nhu cầu bảo vệ:

Khi DBA không được thấy dữ liệu plaintext → dùng Always Encrypted (mã hóa phía client).

Khi cần mã hóa cột cụ thể và server tin cậy được → dùng Column-level encryption (`EncryptByKey`).

Khi cần ẩn giá trị khỏi một số người dùng → dùng Dynamic Data Masking kết hợp quyền UNMASK.

Khi mỗi người dùng chỉ được thấy dòng dữ liệu của riêng mình → dùng Row-Level Security (filter predicate).

Khi cần giới hạn ai có thể truy vấn bảng hoặc chạy stored procedure → dùng Object-level permissions (`GRANT`/`DENY`/`REVOKE`).

Khi cần loại bỏ mật khẩu khỏi code ứng dụng → dùng Passwordless auth kết hợp Managed Identity.

Khi cần theo dõi ai đã truy cập gì và khi nào → dùng Auditing (audit spec cấp server và database).

Khi cần phát hiện SQL injection và truy cập bất thường → dùng Microsoft Defender for SQL kết hợp Threat Detection.

Mẹo cho kỳ thi: Masking là che khuất, không phải mã hóa. Nếu đề bài yêu cầu "DBA không được thấy plaintext", đáp án đúng là Always Encrypted, không phải DDM.

---

### Slide 10 — Module 2: Optimize Database Performance

Chuyển sang Module 2: Tối ưu hóa hiệu năng database. Chúng ta sẽ học cách chọn đúng service tier, quản lý concurrency bằng isolation level, phân tích truy vấn với execution plan, và tận dụng Query Store để quản lý execution plan.

---

### Slide 11 — Service Tiers & Database Configuration

Cần chọn đúng cấu hình compute và storage phù hợp với yêu cầu workload.

**General Purpose**: compute tiêu chuẩn với remote storage, tối đa 80 vCore và 400 GB bộ nhớ, tính khả dụng zone-redundant. Phù hợp cho hầu hết các workload doanh nghiệp.

**Business Critical**: dùng local SSD với read replica tích hợp sẵn, độ trễ thấp nhất, IOPS cao nhất, hỗ trợ In-memory OLTP. Phù hợp cho OLTP mang tính sống còn (mission-critical).

**Hyperscale**: kiến trúc phân tán, dung lượng trên 128 TB, backup gần như tức thời ở mọi kích thước, tối đa 30 read replica. Phù hợp cho workload lớn và co giãn linh hoạt.

**Serverless**: tự động scale compute, tự động tạm dừng (auto-pause), tính phí theo từng giây sử dụng compute, có thể cấu hình vCore tối thiểu/tối đa. Phù hợp cho các workload không liên tục, có tính bùng nổ.

Về mô hình định giá: mô hình **DTU** gộp CPU, I/O, và bộ nhớ thành một gói — đơn giản, giá cả dễ dự đoán, phù hợp khi muốn một gói compute được cấu hình sẵn. Mô hình **vCore** cho phép mở rộng độc lập CPU, bộ nhớ, và storage, đủ điều kiện dùng Azure Hybrid Benefit — phù hợp khi cần kiểm soát tài nguyên chi tiết.

---

### Slide 12 — Transaction Isolation Levels & Concurrency

Cần cân bằng giữa tính nhất quán và throughput bằng cách chọn đúng isolation level cho mỗi workload. Đây là bảng so sánh các isolation level theo 4 tiêu chí: Dirty Read, Non-Repeatable Read, Phantom Read, và mức độ Blocking:

`READ UNCOMMITTED`: có cả 3 vấn đề Dirty Read, Non-Repeatable, và Phantom; mức blocking tối thiểu.

`READ COMMITTED` (mặc định): không có Dirty Read, nhưng vẫn có Non-Repeatable và Phantom; mức blocking trung bình.

`REPEATABLE READ`: không có Dirty Read và Non-Repeatable, nhưng vẫn có Phantom; mức blocking cao.

`SERIALIZABLE`: không có cả 3 vấn đề; mức blocking cao nhất.

`SNAPSHOT`: không có cả 3 vấn đề, và không blocking nhờ cơ chế MVCC.

`READ COMMITTED SNAPSHOT`: không có Dirty Read, nhưng vẫn có Non-Repeatable và Phantom; không blocking nhờ MVCC.

Về mặc định của Azure SQL Database: Azure SQL Database bật `READ COMMITTED SNAPSHOT` mặc định, sử dụng row versioning thay vì khóa. Điều này loại bỏ tình trạng blocking giữa reader và writer, nhưng sẽ dùng tempdb cho version store. Trong khi đó, SQL Server on-premises mặc định dùng `READ COMMITTED` kiểu pessimistic với shared lock.

---

### Slide 13 — Execution Plans & Dynamic Management Views

Chúng ta phân tích hiệu năng truy vấn ở cấp độ toán tử (operator) và khai thác metadata workload theo thời gian thực.

**Execution Plans**: **Estimated Plan** được biên dịch mà không thực thi, cho biết lựa chọn của optimizer, chi phí ước tính, và số dòng ước tính. **Actual Plan** bao gồm số dòng thực tế, memory grant, và thống kê runtime — rất cần thiết để phát hiện lỗi cardinality.

Các operator quan trọng cần chú ý: Table/Index Scan — quét toàn bộ, thường là dấu hiệu thiếu index; Key Lookup — bước nhảy từ nonclustered index sang clustered index; Sort with spill — memory grant không đủ; Implicit conversion — sai lệch kiểu dữ liệu làm mất khả năng index seek.

Về các DMV quan trọng cho hiệu năng: `sys.dm_exec_query_stats` — CPU, số lần đọc/ghi, số lần thực thi tích lũy theo từng execution plan; `sys.dm_exec_requests` — các request đang chạy cùng loại wait và thông tin blocking; `sys.dm_db_index_usage_stats` — số lần seek, scan, lookup, update trên mỗi index kể từ lần restart; `sys.dm_db_missing_index_*` — các index còn thiếu được optimizer gợi ý cùng mức độ ảnh hưởng ước tính; `sys.dm_os_wait_stats` — tổng hợp các loại wait trên toàn instance để xác định điểm nghẽn; `sys.dm_tran_locks` — các lock đang hoạt động, loại lock, và tài nguyên đang bị khóa.

---

### Slide 14 — Query Store & Query Performance Insight

**Query Store** giúp theo dõi hiệu năng truy vấn theo thời gian, phát hiện suy giảm hiệu năng (regression), và ép buộc dùng execution plan tối ưu.

Automatic Capture: tự động lưu trữ văn bản truy vấn, execution plan, và thống kê runtime ngay trong database.

Plan History: theo dõi tất cả execution plan của mỗi truy vấn theo thời gian, giúp phát hiện regression.

Plan Forcing: ép trình tối ưu hóa dùng một plan đã biết là tốt, bằng `sp_query_store_force_plan`.

Regressed Queries: có báo cáo tích hợp sẵn để xác định các truy vấn bị suy giảm hiệu năng.

Wait Statistics: thống kê wait ở cấp truy vấn cho biết chính xác từng truy vấn đang chờ điều gì.

Automatic Tuning: SQL Server tự động ép dùng lại plan tốt cuối cùng đã biết khi phát hiện regression.

Custom Capture Policy: có thể lọc theo số lần thực thi, ngưỡng CPU, hoặc chu kỳ dọn dẹp truy vấn cũ.

**Query Performance Insight**: là dashboard trên Azure portal dành cho Azure SQL Database, hiển thị trực quan các truy vấn tiêu tốn tài nguyên nhiều nhất, cho phép lọc theo khoảng thời gian tương tác, xem chi tiết lịch sử từng truy vấn. Được xây dựng trên dữ liệu Query Store, có gợi ý về index, và các view về CPU, data I/O, và log I/O.

---

### Slide 15 — Blocking & Deadlocks

Cần xác định và giải quyết các vấn đề về concurrency ảnh hưởng đến throughput của ứng dụng.

**Blocking (Chặn)**: Về phát hiện: `sys.dm_exec_requests` — kiểm tra `blocking_session_id`; `sys.dm_tran_locks` — xem loại lock và tài nguyên; `sp_who2` hoặc Activity Monitor để xem nhanh chuỗi blocking. Về chiến lược giải quyết: giữ transaction ngắn gọn để giảm thời gian giữ lock; dùng `READ COMMITTED SNAPSHOT` để loại bỏ blocking giữa reader và writer; thêm index phù hợp để giảm thời gian giữ lock; dùng hint `NOLOCK` chỉ để monitoring (có nguy cơ đọc dữ liệu bẩn - dirty read); cấu hình lock timeout bằng `SET LOCK_TIMEOUT`.

**Deadlocks (Bế tắc)**: Cách deadlock xảy ra: hai hoặc nhiều transaction cùng giữ một lock mà bên kia cần; SQL Server phát hiện chu trình vòng lặp và kill một transaction (gọi là "victim"). Về chẩn đoán: Extended Events — `system_health` ghi lại deadlock graph; deadlock graph XML chứa thông tin về các process, resource, và victim; trace flag 1222 ghi thông tin deadlock vào error log. Về phòng ngừa: truy cập đối tượng theo cùng một thứ tự trên tất cả các transaction; giữ transaction ngắn và ở mức isolation thấp nhất cần thiết; dùng SNAPSHOT isolation để tránh xung đột dựa trên lock.

---

### Slide 16 — Module 3: Implement CI/CD with SQL Database Projects

Chuyển sang Module 3: Triển khai CI/CD với SQL Database Projects. Chúng ta sẽ học cách quản lý source control, branching, phát hiện schema drift, pipeline tự động, và chiến lược testing.

---

### Slide 17 — SQL Database Projects & Source Control

Chúng ta quản lý schema database dưới dạng code (schema-as-code), theo mô hình khai báo (declarative) và có kiểm soát phiên bản.

**SQL Database Projects**: mô hình khai báo — mỗi file .sql định nghĩa trạng thái mong muốn của một đối tượng. Quá trình build tạo ra một DACPAC (data-tier application package). Việc deploy sẽ so sánh DACPAC với target và sinh ra change script. Định dạng project kiểu SDK (.sqlproj) cho phép công cụ đa nền tảng. Hoạt động được trong VS Code, Visual Studio, và Azure Data Studio.

**Source Control & Branching**: kiểm soát phiên bản dựa trên Git cho mọi thay đổi schema; feature branch để phát triển độc lập; pull request kèm review schema diff trước khi merge; schema comparison để đồng bộ project với database thực tế; chiến lược branching phổ biến: main > develop > feature/hotfix.

**Schema Drift Detection (Phát hiện lệch schema)**: schema drift xảy ra khi có thay đổi trực tiếp trên production nằm ngoài SQL project — ví dụ chạy lệnh `ALTER` thủ công, hoặc thay đổi trực tiếp qua Azure portal. Có thể phát hiện drift bằng cách so sánh mô hình project với database thực tế. Nên dùng công cụ schema comparison để xác định các thay đổi chưa được theo dõi, sau đó quyết định đưa vào project hoặc hoàn tác chúng.

---

### Slide 18 — Automated Pipelines & Testing

Chúng ta cần build, validate, test, và deploy các thay đổi database thông qua pipeline CI/CD tự động, gồm 4 bước:

Bước 1 — **Build**: biên dịch file .sqlproj thành DACPAC, kiểm tra tham chiếu schema.

Bước 2 — **Validate**: so sánh schema với target, review change script được sinh ra.

Bước 3 — **Test**: chạy unit test bằng tSQLt, integration test trên database tạm thời (ephemeral).

Bước 4 — **Deploy**: dùng SqlPackage để publish tới target, kèm pre/post script.

Về chiến lược testing: framework tSQLt để viết unit test T-SQL ngay trong database; kiểm tra pre-deployment — review các change script được sinh ra; smoke test post-deployment — xác minh đối tượng và tính toàn vẹn dữ liệu; database tạm thời (ephemeral) — khởi tạo instance test, deploy, test, rồi hủy đi; data-driven test — kiểm tra ràng buộc, tính toàn vẹn tham chiếu, computed column.

Về hỗ trợ nền tảng: GitHub Actions — dùng `dotnet build` kết hợp SqlPackage trong workflow CI; Azure DevOps — có task deploy Azure SQL Database riêng; SqlPackage CLI — công cụ đa nền tảng cho publish, extract, export, import; pre/post-deployment script cho việc migrate và seed dữ liệu; biến SQLCMD cho connection string theo từng môi trường cụ thể.

---

### Slide 19 — Module 4: Integrate SQL Solutions with Azure Services

Sang Module 4, phần cuối cùng: Tích hợp các giải pháp SQL với dịch vụ Azure. Chúng ta sẽ tạo REST và GraphQL API với Data API Builder, triển khai lên các dịch vụ hosting của Azure, và cài đặt monitoring cùng các pattern hướng sự kiện (event-driven).

---

### Slide 20 — Data API Builder: REST & GraphQL APIs

**Data API Builder** cho phép sinh ra API bảo mật, sẵn sàng cho production từ schema database mà không cần viết code ứng dụng.

Về khả năng cốt lõi: tự động sinh endpoint REST và GraphQL từ bảng, view, stored procedure; cấu hình dạng JSON định nghĩa entity, quyền, mối quan hệ; xác thực tích hợp sẵn với Microsoft Entra ID và EasyAuth; phân quyền dựa trên vai trò ở cấp entity và cấp trường; hỗ trợ SQL Server, Azure SQL, Cosmos DB, MySQL, PostgreSQL; hỗ trợ sẵn phân trang, lọc, sắp xếp, và chọn trường.

Về các tùy chọn triển khai: Azure Static Web Apps (có kết nối database tích hợp sẵn); Azure Container Apps cho triển khai dạng container; Azure App Service cho hosting web truyền thống; phát triển local với DAB CLI (`dab start`); container Docker để đảm bảo tính đồng nhất dev/prod; Azure API Management cho các tính năng gateway nâng cao.

Về tính năng bảo mật và hiệu năng: Response Caching — TTL cache có thể cấu hình theo từng entity để giảm tải database; Cross-Origin (CORS) — cấu hình origin được phép cho truy cập API từ trình duyệt; GraphQL Depth Limiting — giới hạn độ sâu truy vấn để ngăn lạm dụng và tiêu tốn tài nguyên quá mức.

---

### Slide 21 — Monitoring & Event-Driven Patterns

Chúng ta cần triển khai khả năng quan sát (observability) và phản ứng với thay đổi dữ liệu bằng các pattern tích hợp Azure-native.

**Azure Monitor & Diagnostics**: metrics của Azure Monitor gồm CPU%, DTU%, storage, connections, deadlock; diagnostic settings để stream tới Log Analytics, Event Hubs, hoặc Storage; truy vấn KQL trong Log Analytics để phân tích hiệu năng sâu; alert rule để kích hoạt thông báo khi vượt ngưỡng; Intelligent Insights — phát hiện bất thường hiệu năng bằng AI.

**Event-Driven Change Patterns (Mẫu hướng sự kiện)**: Change Data Capture (CDC) — theo dõi thay đổi ở cấp dòng trên bảng; Change Tracking — phát hiện thay đổi nhẹ nhàng cho các tình huống đồng bộ; Azure Functions SQL trigger — phản ứng với thay đổi theo thời gian thực; Logic Apps — tự động hóa workflow từ sự kiện database; Event Hubs — stream các thay đổi database tới các consumer downstream.

Về các mẫu kiến trúc tích hợp: `sp_invoke_external_rest_endpoint` — gọi trực tiếp REST API bên ngoài từ T-SQL (chỉ trên Azure SQL DB); Azure Functions kết hợp SQL binding — input/output binding cho truy cập database serverless; Logic Apps SQL connector — tự động hóa workflow low-code với trigger từ database; Event Grid kết hợp Change Events — publish sự kiện thay đổi database cho kiến trúc microservice.

---

### Slide 22 — Key Takeaways

Tổng kết toàn bộ nội dung hôm nay:

Always Encrypted bảo vệ dữ liệu ngay cả khỏi DBA; Dynamic Data Masking là che khuất, không phải mã hóa.

Row-Level Security lọc dòng dữ liệu một cách trong suốt; kết hợp với `SESSION_CONTEXT` cho ứng dụng multi-tenant.

Xác thực passwordless kết hợp Managed Identity loại bỏ rủi ro credential trong code ứng dụng.

Chọn service tier dựa trên workload: General Purpose cho phần lớn trường hợp, Business Critical cho OLTP độ trễ thấp.

Query Store theo dõi hiệu năng lịch sử và cho phép tự động sửa lỗi khi plan bị suy giảm (regression).

`READ COMMITTED SNAPSHOT` là mặc định của Azure SQL, giúp loại bỏ blocking giữa reader và writer.

SQL Database Projects mang lại việc quản lý schema khai báo, có kiểm soát phiên bản, cùng pipeline CI/CD.

Data API Builder sinh ra endpoint REST và GraphQL bảo mật trực tiếp từ schema database.

Azure Monitor, CDC, và Azure Functions SQL trigger cho phép quan sát và kiến trúc hướng sự kiện.

Nguồn tham khảo: learn.microsoft.com/training/paths/secure-optimize-deploy-database-solutions.

---

### Slide 23 — References

Hai đường link quan trọng các bạn nên lưu lại:

Thứ nhất, trang chứng chỉ DP-800 chính thức trên Microsoft Learn.

Thứ hai, loạt video cộng đồng trên Microsoft Reactor — series "Data Days: The SQL AI Series".

---

### Slide 24 — Thank you, crew!

Cảm ơn tất cả các bạn đã đồng hành cùng mình trong suốt loạt bài này! Qua ba buổi, các bạn đã có đủ kỹ năng để bảo mật, tối ưu hóa, và triển khai các giải pháp SQL+AI sẵn sàng cho production — giờ thì hãy bắt tay vào xây dựng một điều gì đó thật tuyệt vời. Chúc các bạn thi tốt chứng chỉ DP-800, và hẹn gặp lại trong những buổi chia sẻ tiếp theo!
