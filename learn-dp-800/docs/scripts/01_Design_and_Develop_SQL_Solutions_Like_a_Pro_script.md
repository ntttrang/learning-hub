# Kịch bản thuyết trình (Tiếng Việt)
## Design and Develop SQL Solutions Like a Pro — DP-800

> Ghi chú: Các thuật ngữ kỹ thuật (tên hàm, cú pháp T-SQL, tên tính năng) được giữ nguyên tiếng Anh để đúng với nội dung thi chứng chỉ. Phần lời dẫn còn lại bằng tiếng Việt để trình bày tự nhiên.

---

### Slide 1 — Trang bìa: Design and Develop SQL Solutions Like a Pro

Xin chào mọi người, cảm ơn các bạn đã dành thời gian tham gia buổi chia sẻ hôm nay. Chủ đề của chúng ta là "Design and Develop SQL Solutions Like a Pro" — nằm trong loạt bài chuẩn bị cho chứng chỉ DP-800 của Microsoft. Đây là phần đầu tiên trong chuỗi ba buổi, tập trung vào cách thiết kế và phát triển các giải pháp SQL một cách chuyên nghiệp, từ việc tạo đối tượng database cho đến viết T-SQL nâng cao và ứng dụng AI vào quá trình phát triển.

---

### Slide 2 — Microsoft Certified: SQL AI Developer Associate

Trước khi đi vào nội dung chuyên môn, mình muốn giới thiệu sơ lược về chứng chỉ này. Đây là chứng chỉ **Microsoft Certified: SQL AI Developer Associate**, mã thi là **DP-800**, dành cho vai trò Developer, ở mức độ Intermediate — tức là bạn cần có nền tảng SQL cơ bản trước khi thi.

Về nền tảng cốt lõi, chứng chỉ này bao phủ ba môi trường chính: **Microsoft SQL Server**, **Azure SQL**, và **SQL database trong Microsoft Fabric**.

Những kỹ năng trọng tâm bao gồm: phát triển T-SQL, thiết kế mô hình dữ liệu quan hệ và bán cấu trúc (semi-structured), triển khai CI/CD với GitHub, nắm vững kiến thức nền tảng về AI như embeddings, vector, model, và sử dụng các công cụ phát triển có hỗ trợ AI.

Về vai trò công việc, người đạt chứng chỉ này cần biết cách xây dựng các giải pháp database an toàn và có khả năng mở rộng, tích hợp AI vào ứng dụng dựa trên database, tối ưu hóa - triển khai - và quản trị các workload SQL. Đây cũng là người thường xuyên phối hợp với App developer, DBA, kiến trúc sư hệ thống, kỹ sư AI và DevSecOps, cũng như đội ngũ bảo mật và tuân thủ.

---

### Slide 3 — Mục lục (Table of Contents)

Nội dung hôm nay được chia thành 4 module chính:

Module 1 — Design & Implement Database Objects: thiết kế và triển khai các đối tượng database.

Module 2 — Implement Programmability Objects: triển khai các đối tượng lập trình như view, stored procedure, function, trigger.

Module 3 — Write Advanced T-SQL Code: viết T-SQL nâng cao.

Module 4 — AI-Assisted Database Development: phát triển database với sự hỗ trợ của AI.

Chúng ta sẽ đi lần lượt từng module.

---

### Slide 4 — Module 1: Design & Implement Database Objects

Bắt đầu với Module 1: Thiết kế và triển khai các đối tượng database. Trong phần này chúng ta sẽ nói về bảng (table), index, ràng buộc (constraint), cột JSON, phân vùng dữ liệu (partitioning), và các loại bảng chuyên biệt trên cả ba nền tảng: SQL Server, Azure SQL, và Microsoft Fabric.

---

### Slide 5 — Platform Choices

Đầu tiên là các lựa chọn nền tảng để chạy SQL Server.

**SQL Server On-Prem**: kiểm soát toàn quyền, chạy trên Windows hoặc Linux, tự quản lý hoàn toàn.

**Docker / Kubernetes**: chạy dưới dạng container, phù hợp cho môi trường dev/test vì đảm bảo tính đồng nhất và khởi tạo nhanh.

**Azure SQL Database / Managed Instance**: là dịch vụ PaaS được quản lý sẵn, có tính năng High Availability tích hợp và các gói serverless.

**Fabric SQL Database**: nền tảng phân tích hợp nhất, tích hợp OneLake và sẵn sàng cho AI với Copilot.

Tùy vào nhu cầu về kiểm soát, chi phí, và khả năng mở rộng mà chúng ta chọn nền tảng phù hợp.

---

### Slide 6 — Table Design

Tiếp theo là các nguyên tắc thiết kế bảng.

Thứ nhất, hãy chọn kiểu dữ liệu (data type) và kích thước phù hợp để tối ưu hóa lưu trữ và hiệu năng — đừng dùng VARCHAR(MAX) cho mọi thứ.

Thứ hai, nên chuẩn hóa dữ liệu đến dạng chuẩn thứ ba (Third Normal Form - 3NF), nhưng có thể phi chuẩn hóa (denormalize) một cách có chọn lọc cho các workload đọc nhiều.

Thứ ba, mỗi bảng đều cần một primary key — và key này nên hẹp (narrow) và bất biến (immutable), tức là không thay đổi giá trị theo thời gian.

---

### Slide 7 — Specialized Table Types

Ngoài bảng thông thường, SQL Server còn hỗ trợ nhiều loại bảng chuyên biệt:

**In-Memory OLTP**: dữ liệu nằm hoàn toàn trong RAM, sử dụng cơ chế MVCC không khóa (lock-free), nhanh hơn tới 30 lần so với OLTP truyền thống, kết hợp với stored procedure được biên dịch native.

**Temporal table**: theo dõi lịch sử thay đổi dữ liệu tự động theo phiên bản hệ thống, cho phép truy vấn với cú pháp `FOR SYSTEM_TIME AS OF`.

**External table**: truy vấn dữ liệu từ xa thông qua PolyBase — như Blob Storage, ADLS, S3, Oracle — mà không cần di chuyển dữ liệu.

**Ledger table**: chống giả mạo, có khả năng xác minh bằng mật mã học, hỗ trợ cả dạng updatable lẫn append-only.

**Graph table**: gồm bảng NODE và EDGE, kết hợp với mệnh đề MATCH, dùng cho các bài toán như mạng xã hội, phát hiện gian lận, hệ thống gợi ý.

Mẹo nhỏ: hãy chọn loại bảng phù hợp với workload — temporal cho audit, ledger cho tuân thủ, graph cho quan hệ phức tạp, in-memory cho throughput cao.

---

### Slide 8 — Optimize with Indexes

Về index, có rất nhiều loại để tối ưu hiệu năng truy vấn:

**Clustered index**: quy định thứ tự sắp xếp vật lý của dữ liệu, mỗi bảng chỉ có 1 clustered index.

**Nonclustered index**: cấu trúc tra cứu riêng biệt để lấy dữ liệu nhanh, một bảng có thể có tới 999 index loại này.

**Columnstore index**: lưu trữ theo cột, tối ưu cho phân tích dữ liệu (analytics) và data warehouse.

**Filtered index**: chỉ đánh index một tập con của các dòng dữ liệu, giúp tối ưu cho truy vấn cụ thể.

**Full-Text index**: cho phép tìm kiếm ngôn ngữ tự nhiên trên nội dung văn bản.

**JSON Index**: là tính năng mới trong SQL Server 2025, đánh index trực tiếp trên các path của JSON.

**Vector Index**: cũng là tính năng mới của SQL Server 2025 — một loại index chuyên biệt để tối ưu tìm kiếm tương đồng (similarity search) trên dữ liệu vector, thường dùng trong machine learning, hệ gợi ý, và các ứng dụng AI. Nó cho phép tìm kiếm nearest neighbor hiệu quả bằng cách tổ chức vector theo khoảng cách tương đối.

Nguyên tắc chung: hãy đánh index trên các cột được dùng trong WHERE, JOIN, và ORDER BY để đạt hiệu năng tốt nhất.

---

### Slide 9 — Constraints & JSON Support

Về ràng buộc dữ liệu (constraints):

**PRIMARY KEY**: định danh duy nhất cho mỗi dòng, mặc định tạo clustered index, không cho phép NULL.

**FOREIGN KEY**: đảm bảo tính toàn vẹn tham chiếu, hỗ trợ các hành vi CASCADE, SET NULL, hoặc NO ACTION.

**UNIQUE**: đảm bảo giá trị không trùng lặp, cho phép một giá trị NULL, và tạo nonclustered index.

**CHECK**: kiểm tra điều kiện logic, ví dụ `salary >= 15000 AND salary <= 100000`.

**DEFAULT**: tự động gán giá trị khi INSERT, ví dụ dùng `GETDATE()`, `NEWID()`, hoặc giá trị cố định.

Về hỗ trợ JSON: SQL Server 2025 giới thiệu kiểu dữ liệu JSON gốc (native), hỗ trợ tới 2 GB mỗi dòng. Chúng ta có các hàm `JSON_VALUE`, `JSON_QUERY`, `JSON_MODIFY`, `OPENJSON` để phân tích và biến đổi dữ liệu; `JSON_OBJECT` và `JSON_ARRAY` để xây dựng JSON từ SQL. Có thể tạo computed column kết hợp index chuẩn cho các path cụ thể ở mọi phiên bản, hoặc từ SQL 2025 trở đi, dùng trực tiếp `CREATE JSON INDEX` để bao phủ tất cả các path mà không cần computed column. Điều này giúp kết nối mô hình quan hệ và mô hình tài liệu (document) trên cùng một nền tảng. Hàm `ISJSON()` dùng để kiểm tra tính hợp lệ của JSON trước khi lưu, còn `OPENJSON` dùng để tách JSON thành các dòng dữ liệu.

---

### Slide 10 — Sequences & Partitioning

Về **SEQUENCE** so với **IDENTITY**:

Về phạm vi: SEQUENCE hoạt động ở cấp database, có thể dùng chung cho nhiều bảng; còn IDENTITY chỉ hoạt động ở cấp cột, gắn với một bảng duy nhất.

Về việc tạo giá trị trước: SEQUENCE cho phép lấy giá trị bằng `NEXT VALUE FOR` trước khi INSERT; còn IDENTITY chỉ sinh giá trị khi INSERT.

Về khả năng lặp vòng (cycling): SEQUENCE có thể cấu hình CYCLE hoặc NO CYCLE; IDENTITY thì không hỗ trợ.

Về việc dùng qua nhiều server: SEQUENCE hoạt động tốt trên linked server; còn IDENTITY thường gặp vấn đề khi cần `SET IDENTITY_INSERT`.

Về chiến lược **Partitioning** (phân vùng), quy trình gồm 4 bước: tạo Partition Function, tạo Partition Scheme, tạo bảng dựa trên scheme đó, và cuối cùng là các Aligned Index (index được phân vùng đồng bộ với bảng).

Lợi ích của partitioning: giúp loại trừ phân vùng không liên quan khi truy vấn (partition elimination) — chỉ quét những phân vùng cần thiết; cho phép lưu trữ dữ liệu tức thời bằng `ALTER TABLE SWITCH`; có thể rebuild index theo từng phân vùng riêng để giảm downtime; và hỗ trợ mô hình sliding window để tự động quản lý vòng đời dữ liệu.

---

### Slide 11 — Module 2: Implement Programmability Objects

Chuyển sang Module 2: Triển khai các đối tượng lập trình. Chúng ta sẽ tìm hiểu về view, stored procedure, scalar function, table-valued function, và trigger — nhằm xây dựng các giải pháp database dễ bảo trì, an toàn và hiệu quả.

---

### Slide 12 — Views

Về **View** — về bản chất là bảng ảo (virtual table) giúp đơn giản hóa việc truy cập dữ liệu, tăng cường bảo mật, và trừu tượng hóa các thay đổi schema.

**View tiêu chuẩn**: gói gọn các JOIN phức tạp thành truy vấn có thể tái sử dụng; có thể cấp quyền SELECT trên view mà không cần lộ bảng gốc; và `WITH CHECK OPTION` ngăn việc insert dữ liệu vi phạm điều kiện WHERE của view.

**Indexed View (hay còn gọi là Materialized View)**: cần dùng `WITH SCHEMABINDING` kết hợp unique clustered index; dữ liệu kết quả được lưu trữ vật lý, giúp đọc nhanh với các truy vấn tổng hợp (aggregation); tuy nhiên nó tự động cập nhật khi có thao tác DML, nên cần cân nhắc chi phí ghi (write overhead).

**Partitioned View**: dùng `UNION ALL` giữa các bảng thành viên có ràng buộc CHECK; distributed partitioned view có thể trải rộng trên nhiều server; và trình tối ưu hóa truy vấn (query optimizer) sẽ chỉ định tuyến đến các bảng thành viên liên quan.

Một số best practice: dùng SCHEMABINDING để tránh thay đổi vô tình ở bảng gốc; tránh dùng SELECT *; xây dựng nhiều lớp view cho các quy tắc bảo mật phức tạp; và không nên lồng view quá 2 cấp để đảm bảo dễ đọc.

---

### Slide 13 — Stored Procedures

**Stored Procedure** là các chương trình được biên dịch phía server, giúp gói gọn logic nghiệp vụ, giảm số lần round-trip qua mạng, và tăng cường bảo mật.

Về khả năng cốt lõi: hỗ trợ tham số INPUT và OUTPUT để trao đổi dữ liệu linh hoạt; giá trị RETURN dùng cho mã trạng thái và luồng thực thi; bảng tạm (temp table) và table variable để lưu kết quả trung gian; dynamic SQL kết hợp `sp_executesql` để xây dựng truy vấn lúc runtime; `TRY...CATCH` kết hợp transaction để đảm bảo tính nguyên tử; `EXECUTE AS` để chuyển đổi ngữ cảnh bảo mật; và `SET NOCOUNT ON` để tắt thông báo số dòng bị ảnh hưởng.

Về mẫu thiết kế (design pattern): dùng cho các thao tác CRUD để gói gọn logic INSERT/UPDATE/DELETE; cho các pipeline ETL để điều phối việc di chuyển và biến đổi dữ liệu; cho việc tạo báo cáo bằng cách tổng hợp dữ liệu trước; các stored procedure biên dịch native để chạy trực tiếp thành mã máy cho bảng in-memory; cấp quyền EXECUTE mà không cần cấp quyền truy cập bảng trực tiếp, tạo thêm một lớp bảo mật; và lưu ý về plan caching — kế hoạch thực thi được biên dịch một lần và tái sử dụng, nhưng cần cẩn trọng với vấn đề parameter sniffing. Khi plan bị lệch, có thể dùng `OPTION (RECOMPILE)` hoặc `OPTIMIZE FOR`.

---

### Slide 14 — User-Defined Functions

Về **User-Defined Function (UDF)**, có ba loại chính:

**Scalar Function**: trả về một giá trị đơn (INT, VARCHAR, v.v.), có thể gọi trong SELECT, WHERE, hoặc CHECK constraint. Nếu là deterministic, có thể dùng để tạo computed column có thể đánh index. Tuy nhiên cần thận trọng vì việc thực thi theo từng dòng (row-by-row) có thể ảnh hưởng hiệu năng với tập dữ liệu lớn. Nên dùng `WITH SCHEMABINDING` để tối ưu.

**Inline Table-Valued Function (iTVF)**: chỉ gồm một câu lệnh SELECT trả về một bảng — cho hiệu năng tốt nhất vì được optimizer "inline" giống như một parameterized view. Hỗ trợ JOIN, WHERE, và aggregation ngay trong thân hàm. Nên ưu tiên loại này hơn multi-statement TVF cho các truy vấn đọc, và có thể dùng trong `CROSS APPLY` / `OUTER APPLY`.

**Multi-Statement TVF**: gồm nhiều câu lệnh, khai báo tường minh biến `RETURNS TABLE`, thường được điền dữ liệu qua vòng lặp `INSERT...SELECT`. Loại này không được inline, nên optimizer thường ước lượng chỉ 1 hoặc 100 dòng — dùng cho logic phức tạp không thể viết bằng một truy vấn đơn. Từ SQL Server 2019 trở đi, tính năng interleaved execution giúp cải thiện việc ước lượng cardinality.

---

### Slide 15 — Triggers

**Trigger** giúp phản hồi tự động khi có thay đổi dữ liệu hoặc sự kiện database — nên dùng một cách tiết chế, chủ yếu cho audit, validation, và enforcement.

**DML Trigger** — loại AFTER hoặc INSTEAD OF: kích hoạt khi có INSERT, UPDATE, DELETE trên bảng hoặc view. AFTER chạy sau khi câu lệnh DML hoàn tất; INSTEAD OF thay thế hoàn toàn thao tác DML, cho phép tạo updatable view. Chúng ta có thể truy cập các bảng giả (pseudo-table) inserted và deleted để lấy giá trị cũ/mới.

**DDL Trigger** ở cấp database hoặc server: phản hồi các sự kiện CREATE, ALTER, DROP. Có thể là database-scoped hoặc server-scoped. Hàm `EVENTDATA()` trả về XML chứa chi tiết sự kiện — hữu ích để audit thay đổi schema hoặc ngăn chặn DDL trái phép.

**Logon Trigger** ở cấp server: kích hoạt khi có sự kiện LOGON sau khi xác thực thành công. Có thể kiểm soát việc tạo session dựa trên thời gian, địa chỉ IP, hoặc số lượng, giới hạn số phiên đồng thời cho mỗi login. Cần dùng thận trọng vì nếu viết sai có thể khóa tất cả người dùng.

Best practice: giữ logic trigger đơn giản, tránh trigger lồng nhau, không nên phụ thuộc vào thứ tự thực thi trigger, cân nhắc dùng temporal table thay thế cho audit, và luôn kiểm thử với thao tác nhiều dòng (multi-row).

---

### Slide 16 — Module 3: Write Advanced T-SQL Code

Sang Module 3: Viết T-SQL nâng cao. Chúng ta sẽ đi qua CTE, window function, xử lý JSON, biểu thức chính quy (regex), fuzzy matching, truy vấn graph, và xử lý lỗi có cấu trúc.

---

### Slide 17 — CTEs & Correlated Subqueries

**Common Table Expression (CTE)**: mệnh đề WITH định nghĩa tập kết quả tạm thời có tên, phạm vi chỉ trong một câu lệnh SELECT, INSERT, UPDATE, hoặc DELETE duy nhất.

**Recursive CTE** dùng cho dữ liệu phân cấp: sơ đồ tổ chức, bill of materials, duyệt cây. Gồm anchor member và recursive member nối với nhau bằng UNION ALL. Có thể dùng hint `MAXRECURSION` để kiểm soát độ sâu — mặc định 100, tối đa 32767.

Chúng ta có thể khai báo nhiều CTE trong cùng một mệnh đề WITH, ngăn cách bằng dấu phẩy — điều này giúp tăng khả năng đọc so với việc lồng nhiều subquery. Lưu ý CTE không được lưu trữ (persisted) — nó được tính toán lại mỗi lần tham chiếu, nên nếu cần dùng lại hai lần thì cân nhắc dùng temp table.

Về **Correlated Subquery**: truy vấn con tham chiếu đến cột của truy vấn ngoài, và được thực thi một lần cho mỗi dòng ngoài — cần lưu ý nguy cơ hiệu năng O(n²). Dùng `EXISTS` / `NOT EXISTS` cho mẫu semi-join; dùng để so sánh theo từng dòng như tìm giá trị lớn nhất trong nhóm, hoặc tính running difference. Thường có thể viết lại bằng JOIN hoặc window function để tăng tốc độ. Cũng hữu ích trong UPDATE/DELETE có điều kiện tương quan. Ngoài ra còn có derived table — subquery trong mệnh đề FROM có alias, và `CROSS APPLY` / `OUTER APPLY` cho các biểu thức table-valued.

---

### Slide 18 — Window Functions

**Window Function** cho phép tính toán trên các dòng liên quan đến dòng hiện tại mà không làm gộp (collapse) tập kết quả như GROUP BY.

**Nhóm Ranking**: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE` — dùng để gán vị trí trong từng phân vùng (partition). `ROW_NUMBER` luôn duy nhất, còn `RANK` cho phép có giá trị bằng nhau (tie).

**Nhóm Offset**: `LAG` / `LEAD`, `FIRST_VALUE`, `LAST_VALUE` — cho phép truy cập dòng trước/sau hoặc biên của partition mà không cần self-join.

**Nhóm Aggregate**: `SUM` / `AVG`, `COUNT` / `MIN`, `MAX` — dùng để tính tổng lũy kế (running total), trung bình động (moving average) qua khung `ROWS BETWEEN` hoặc `RANGE`.

**Nhóm Distribution**: `PERCENT_RANK`, `CUME_DIST`, `PERCENTILE_CONT`, `PERCENTILE_DISC` — dùng cho các phép tính phân phối thống kê và phân vị trong nhóm.

Cú pháp chung: `function() OVER (PARTITION BY col ORDER BY col ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.

---

### Slide 19 — JSON & XML Processing in T-SQL

Về nhóm hàm **JSON**: `FOR JSON PATH` / `AUTO` để chuyển tập kết quả thành JSON; `OPENJSON` để tách mảng/object JSON thành các dòng theo schema; `JSON_VALUE` để trích xuất giá trị vô hướng từ biểu thức `$.path`; `JSON_QUERY` để trích xuất object hoặc mảng con; `JSON_MODIFY` để cập nhật giá trị tại chỗ mà không cần viết lại toàn bộ; `JSON_OBJECT` / `JSON_ARRAY` để xây dựng JSON, có từ SQL 2022 trở đi; `ISJSON` để kiểm tra hợp lệ trước khi lưu hoặc xử lý; và `JSON_CONTAINS` để kiểm tra sự tồn tại của giá trị, có từ SQL 2025.

Về nhóm hàm **XML**: `FOR XML PATH` / `RAW` / `AUTO` để chuyển thành đầu ra XML; phương thức `.query()` cho các biểu thức XQuery trên cột XML; `.value()` để trích xuất giá trị vô hướng từ XPath; `.modify()` để insert, delete, hoặc thay thế node XML; `.nodes()` để tách XML thành các dòng quan hệ; `OPENXML` kết hợp `sp_xml_preparedocument` cho cách phân tích kiểu cũ (legacy); các XML index gồm primary và secondary (PATH, VALUE, PROPERTY); và XML Schema Collection để định kiểu mạnh và validation.

---

### Slide 20 — SQL Server 2025: Regex & Fuzzy Matching

Đây là những tính năng mới đáng chú ý trong SQL Server 2025.

Về **Regular Expression**: `REGEXP_LIKE` để lọc các dòng khớp với một mẫu (pattern), thay thế cho chuỗi LIKE phức tạp; `REGEXP_REPLACE` để thay thế chuỗi dựa trên pattern kèm capture group; `REGEXP_SUBSTR` để trích xuất chuỗi con khớp pattern; `REGEXP_COUNT` để đếm số lần xuất hiện của pattern trong văn bản. Các hàm này là SARGable, tức có thể tận dụng index để thực thi hiệu quả, và sử dụng engine ICU regex hỗ trợ đầy đủ Unicode và các lớp POSIX. Ứng dụng thực tế: kiểm tra email, phân tích số điện thoại, làm sạch dữ liệu, phân tích log.

Về **Fuzzy String Matching**: `EDIT_DISTANCE` tính khoảng cách Levenshtein giữa hai chuỗi; `EDIT_DISTANCE_SIMILARITY` cho ra phần trăm tương đồng từ 0 đến 100; `SOUNDEX` mã hóa ngữ âm cho tên tiếng Anh; `DIFFERENCE` so sánh các mã SOUNDEX theo thang điểm từ 0 đến 4, với 4 là khớp chính xác. Có thể kết hợp với ngưỡng, ví dụ `WHERE EDIT_DISTANCE_SIMILARITY > 80`. Ứng dụng: khử trùng lặp dữ liệu (deduplication), khớp địa chỉ, phân giải tên khách hàng. Quy trình phổ biến: làm sạch trước bằng regex, sau đó khớp bằng fuzzy matching, rồi khử trùng lặp.

---

### Slide 21 — Graph Queries & Error Handling

Về **Graph Query** với mệnh đề `MATCH`: bảng NODE lưu trữ thực thể, bảng EDGE lưu trữ quan hệ. Cú pháp `MATCH`, ví dụ `WHERE MATCH(Person-(Follows)->Person)`. `SHORTEST_PATH` dùng để tìm đường đi ngắn nhất giữa các node, hỗ trợ duyệt với độ dài biến đổi bằng toán tử `+`. Ràng buộc `CONNECTION` giới hạn những node nào mà một edge có thể kết nối. Có thể kết hợp truy vấn graph và truy vấn quan hệ trong cùng một câu lệnh T-SQL. Ứng dụng: mạng xã hội, phát hiện vòng gian lận, sơ đồ tổ chức, hệ gợi ý.

Về xử lý lỗi với **TRY...CATCH**: khối TRY bao các câu lệnh, khối CATCH xử lý lỗi. Các hàm `ERROR_NUMBER()`, `ERROR_MESSAGE()`, `ERROR_SEVERITY()`, `ERROR_LINE()` cung cấp thông tin chi tiết về lỗi. `THROW` dùng để ném lại hoặc tạo lỗi tùy chỉnh — thay thế cho `RAISERROR`. Bật `XACT_ABORT ON` giúp tự động rollback khi có lỗi, đơn giản hóa việc dọn dẹp. Có thể lồng `TRY...CATCH` với transaction để đảm bảo tính nguyên tử cho các thao tác nhiều bước. `@@TRANCOUNT` giúp kiểm tra độ sâu transaction đang hoạt động trước khi COMMIT/ROLLBACK. Và nên ghi lỗi vào bảng log trong khối CATCH trước khi ném lại lỗi.

---

### Slide 22 — Module 4: AI-Assisted Database Development

Cuối cùng, Module 4: Phát triển database với sự hỗ trợ của AI. Chúng ta sẽ tìm hiểu cách tăng tốc việc viết SQL với GitHub Copilot, Fabric Copilot, và Model Context Protocol (MCP) cho các thao tác database dựa trên AI agent.

---

### Slide 23 — GitHub Copilot for SQL

**GitHub Copilot** là trợ lý AI tích hợp trong SSMS 22 và VS Code — có khả năng nhận biết schema và sinh T-SQL theo đúng phiên bản đang dùng.

**Natural Language to SQL**: chỉ cần mô tả yêu cầu bằng tiếng Anh thông thường, Copilot sẽ sinh ra T-SQL nhận biết schema, với tham chiếu bảng/cột và JOIN chính xác.

**Code Completion**: gợi ý "ghost text" theo thời gian thực khi bạn gõ. Nhấn Tab để chấp nhận, tiếp tục gõ để bỏ qua — giúp giảm lỗi cú pháp và code lặp lại.

**Explain & Optimize**: chọn bất kỳ truy vấn nào và yêu cầu Copilot giải thích nó làm gì hoặc gợi ý cách tối ưu — rất hữu ích khi debug code cũ.

**Schema Awareness**: Copilot đọc kết nối database đang active, biết phiên bản SQL, bảng, cột, khóa, và các mối quan hệ để đưa ra gợi ý theo ngữ cảnh.

Yêu cầu: SSMS 22 trở lên hoặc VS Code với extension MSSQL, có gói đăng ký GitHub Copilot (gói miễn phí có 50 request), và luôn tuân thủ quyền truy cập database hiện có.

---

### Slide 24 — Fabric Copilot for SQL

**Fabric Copilot** là trợ lý AI trong workload Fabric SQL database — hỗ trợ truy vấn bằng ngôn ngữ tự nhiên, hoàn thành code, và các thao tác nhanh.

**Chat Pane**: đặt câu hỏi bằng ngôn ngữ tự nhiên về database của bạn, nhận về truy vấn T-SQL hoặc câu trả lời dạng tài liệu trực tiếp trong Fabric portal.

**Code Completion**: bắt đầu gõ trong SQL query editor — Copilot gợi ý hoàn thành tên bảng, hàm, và cả câu truy vấn hoàn chỉnh, nhấn Tab để chấp nhận.

**Quick Actions: Fix**: bôi đen một truy vấn bị lỗi và nhấn Fix — Copilot xác định lỗi, sửa cú pháp, và thêm chú thích giải thích thay đổi.

**Quick Actions: Explain**: chọn bất kỳ đoạn SQL nào và nhấn Explain — Copilot đưa ra giải thích bằng ngôn ngữ tự nhiên về logic truy vấn và cách sử dụng schema.

Fabric Copilot được xây dựng trên cùng nền tảng AI với SSMS Copilot, mang lại trải nghiệm nhất quán trên Fabric portal, SSMS 22, và VS Code.

---

### Slide 25 — Model Context Protocol (MCP)

**Model Context Protocol (MCP)** là một giao thức mở, chuẩn hóa cách các AI agent tương tác an toàn với database — có thể ví như một "cổng USB-C" cho các ứng dụng AI.

Luồng hoạt động: **AI Client** (VS Code, Claude, ChatGPT, Copilot) kết nối tới **MCP Server** (cụ thể là SQL MCP Server, được xây dựng trên Data API Builder), rồi từ đó kết nối tới **SQL Server** (có thể là on-prem, Azure SQL, Fabric, hoặc Docker).

Về các công cụ (tool) mà SQL MCP Server cung cấp: `ListTables` để khám phá các bảng và schema có sẵn; `ReadData` để truy vấn dòng dữ liệu với filter và phân trang; `CreateItem` để thêm dòng mới với giá trị đúng kiểu; `UpdateItem` để sửa dòng hiện có theo khóa; `DeleteItem` để xóa dòng dựa trên khóa; và `ExecuteQuery` để chạy T-SQL tùy chỉnh với kiểm soát RBAC.

Về bảo mật và kiến trúc: được xây dựng trên nền Data API Builder — đã được kiểm chứng về RBAC và telemetry; có kiểm soát truy cập dựa trên vai trò (role-based) cho từng entity và thao tác; có thể triển khai cục bộ qua stdio transport hoặc lên Azure Container Apps; hỗ trợ SQL Server, Azure SQL, và Fabric SQL database; mô tả entity giúp làm giàu ngữ cảnh cho AI để có truy vấn tốt hơn; và quan trọng nhất — không có dữ liệu nào rời khỏi môi trường của bạn, vì MCP server chạy song song với database.

---

### Slide 26 — AI Workflow Integration

Đây là cách kết hợp các công cụ AI trên với nhau: Copilot để viết code, MCP để truy cập dữ liệu trực tiếp, và Fabric để phân tích thống nhất.

**Author (Viết code)**: dùng GitHub Copilot trong SSMS/VS Code để viết và tối ưu T-SQL — các gợi ý nhận biết schema giúp tăng tốc phát triển.

**Connect (Kết nối)**: SQL MCP Server kết nối AI agent với database của bạn — agent có thể khám phá schema và chạy truy vấn thông qua giao thức chuẩn.

**Analyze (Phân tích)**: Fabric Copilot cho phép khám phá dữ liệu bằng ngôn ngữ tự nhiên ngay trong portal — các quick action giúp sửa lỗi và giải thích logic phức tạp.

**Govern (Quản trị)**: file hướng dẫn Copilot (`.github/copilot-instructions.md`) giúp thực thi các tiêu chuẩn coding; RBAC trong MCP kiểm soát quyền truy cập dữ liệu.

Best practice: luôn review SQL do AI sinh ra trước khi đưa vào production; dùng `EXPLAIN` để kiểm chứng execution plan; và nên bắt đầu với quyền chỉ đọc (read-only) cho các AI agent.

---

### Slide 27 — When to Use What — Decision Guide

Đây là bảng hướng dẫn ra quyết định nhanh, tổng hợp lại toàn bộ nội dung:

Khi cần OLTP throughput cao và gặp latch contention → dùng In-memory OLTP table kết hợp stored procedure biên dịch native.

Khi cần audit trail, điều tra dữ liệu, hoặc tuân thủ quy định → dùng Ledger table (updatable hoặc append-only).

Khi cần truy vấn external storage mà không import dữ liệu → dùng External table với PolyBase hoặc REST API.

Khi cần xử lý quan hệ phức tạp như mạng xã hội, gian lận → dùng Graph table kết hợp MATCH và SHORTEST_PATH.

Khi cần lớp truy cập chỉ đọc có thể tái sử dụng → dùng View (tiêu chuẩn hoặc indexed cho aggregation).

Khi cần khớp mẫu phức tạp hoặc phân tích text → dùng hàm Regex (SQL 2025) kết hợp full-text index.

Khi cần viết SQL với sự hỗ trợ AI → dùng GitHub Copilot trong SSMS 22 / VS Code.

Khi cần AI agent thao tác trên database → dùng SQL MCP Server kết hợp Data API Builder và RBAC.

---

### Slide 28 — Key Takeaways

Tổng kết lại những điểm quan trọng nhất của buổi hôm nay:

SQL Server có thể chạy ở khắp mọi nơi — on-premises, Docker, Azure PaaS, và Fabric.

Hãy chọn loại bảng phù hợp với workload: temporal cho audit, ledger cho tuân thủ, graph cho quan hệ.

Chọn đúng loại index: clustered cho OLTP, columnstore cho analytics, JSON index cho SQL 2025 trở lên.

Gói gọn logic trong stored procedure và function — dùng view cho lớp truy cập đọc an toàn, có thể tái sử dụng.

Window function và CTE thay thế cho self-join phức tạp và correlated subquery.

SQL Server 2025 bổ sung regex, fuzzy matching gốc, và cải tiến kiểu JSON.

GitHub Copilot và Fabric Copilot giúp tăng tốc việc viết SQL với AI nhận biết schema.

MCP kết nối AI agent với database một cách an toàn, thông qua RBAC và giao thức chuẩn.

---

### Slide 29 — References

Đây là hai đường link các bạn nên lưu lại:

Thứ nhất, trang chứng chỉ DP-800 chính thức của Microsoft Learn.

Thứ hai, loạt video cộng đồng trên Microsoft Reactor — series "Data Days: The SQL AI Series".

Cả hai link đều có trên slide, các bạn có thể chụp lại hoặc truy cập sau.

---

### Slide 30 — Thank you, crew!

Cảm ơn tất cả các bạn đã theo dõi đến cuối buổi chia sẻ hôm nay! Các bạn giờ đã có đủ kiến thức để thiết kế các đối tượng database vững chắc và viết T-SQL nâng cao, dễ bảo trì — giờ thì hãy bắt tay vào xây dựng một điều gì đó thật tuyệt vời. Hẹn gặp lại các bạn ở phần tiếp theo!
