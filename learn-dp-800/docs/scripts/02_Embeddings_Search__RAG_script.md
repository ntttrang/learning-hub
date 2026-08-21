# Kịch bản thuyết trình (Tiếng Việt)
## Bring AI to SQL w/ Embeddings, Search, & RAG — DP-800

> Ghi chú: Các thuật ngữ kỹ thuật, tên hàm T-SQL và mã nguồn được giữ nguyên tiếng Anh. Phần lời dẫn bằng tiếng Việt để trình bày tự nhiên.

---

### Slide 1 — Trang bìa: Bring AI to SQL w/ Embeddings, Search, & RAG

Xin chào mọi người, chào mừng quay trở lại với phần thứ hai trong loạt bài chuẩn bị chứng chỉ DP-800. Hôm nay chúng ta sẽ nói về cách đưa AI vào SQL thông qua ba mảng: **Embeddings** (biểu diễn vector), **Search** (tìm kiếm thông minh), và **RAG** — Retrieval-Augmented Generation. Đây là phần rất thú vị vì chúng ta sẽ thấy SQL Server không chỉ lưu trữ dữ liệu mà còn có thể "hiểu" và "suy luận" trên dữ liệu đó.

---

### Slide 2 — Mục lục (Table of Contents)

Nội dung hôm nay chia thành 3 module:

Module 1 — Design & Implement Models & Embeddings with SQL: thiết kế và triển khai model cùng embeddings với SQL.

Module 2 — Design & Implement Intelligent Search with SQL: thiết kế và triển khai tìm kiếm thông minh với SQL.

Module 3 — Design & Implement RAG with SQL: thiết kế và triển khai RAG với SQL.

Chúng ta đi lần lượt từng phần.

---

### Slide 3 — Module 1: Design & Implement Models & Embeddings with SQL

Module 1 sẽ nói về external model, chiến lược chia nhỏ văn bản (chunking), cách sinh và lưu trữ embedding, và làm sao để giữ cho embedding luôn "tươi mới" — tức là cập nhật đồng bộ với dữ liệu gốc.

---

### Slide 4 — External AI Models

Với `CREATE EXTERNAL MODEL`, chúng ta có thể tham chiếu trực tiếp đến các endpoint AI ngay từ Transact-SQL mà không cần di chuyển dữ liệu ra khỏi database. External model tạo ra một cầu nối giữa môi trường SQL của bạn và dịch vụ Azure OpenAI.

Cú pháp cơ bản trông như sau — chúng ta dùng `CREATE EXTERNAL MODEL EmbeddingModel WITH (LOCATION = '...', CREDENTIAL = [MyCredential], MODEL_TYPE = EMBEDDINGS)`.

Mẹo quan trọng: `CREATE EXTERNAL MODEL` chính là điểm khởi đầu cho mọi tích hợp AI trong SQL — hãy nắm chắc cú pháp và biết khi nào dùng từng loại `MODEL_TYPE`.

Một số khái niệm cốt lõi cần nhớ: đánh giá model (Model Evaluation) — chọn model dựa trên khả năng, độ trễ (latency), chi phí, và giới hạn token; các loại model (Model Types) — `EMBEDDINGS` dùng để tạo vector, `COMPLETIONS` dùng để sinh văn bản; quản lý credential — nên dùng database-scoped credential kết hợp Managed Identity; và bảo mật endpoint — luôn bảo vệ endpoint của model bằng Managed Identity, không nhúng secret trực tiếp trong code.

---

### Slide 5 — Designing Embeddings: What to Embed

Một câu hỏi quan trọng khi thiết kế embedding là: cột nào nên embed, cột nào không?

**Nên embed**: mô tả sản phẩm — vì chứa nội dung ngữ nghĩa phong phú mà người dùng thường tìm kiếm bằng ngôn ngữ tự nhiên; nội dung đánh giá của khách hàng — vì chứa ý kiến và trải nghiệm phù hợp cho tìm kiếm ngữ nghĩa; tài liệu kỹ thuật — vì là nội dung dài với nhiều khái niệm có thể tìm kiếm.

**Có thể cân nhắc**: tên sản phẩm — là văn bản ngắn, chỉ hữu ích nếu kết hợp với mô tả.

**Không nên embed**: giá cả, số lượng — vì là dữ liệu số, nên dùng toán tử so sánh SQL thông thường; mã trạng thái, ID — vì là dữ liệu phân loại (categorical), nên dùng khớp chính xác thay vì tìm kiếm ngữ nghĩa.

Mẹo hay: hãy kết hợp các cột liên quan để tạo embedding phong phú hơn — nối các trường có ý nghĩa trước khi embed, ví dụ: `SELECT Name + ' | ' + Category + ' | ' + Description AS EmbeddingInput`.

---

### Slide 6 — Chunking Strategies

Các model embedding đều có giới hạn token, thường từ 512 đến 8.192 token. Vì vậy tài liệu dài cần được chia nhỏ thành các "chunk".

**Fixed-Size (Kích thước cố định)**: chia mỗi N ký tự/token — đơn giản, dễ dự đoán, nhưng có thể cắt giữa câu.

**Sentence-Based (Theo câu)**: chia theo ranh giới câu — giữ được ý nghĩa, nhưng kích thước chunk không đồng đều.

**Paragraph-Based (Theo đoạn văn)**: chia theo đoạn văn — có ranh giới tự nhiên, nhưng độ dài đoạn văn khác nhau.

**Semantic (Theo ngữ nghĩa)**: chia tại nơi chủ đề thay đổi — giữ ý nghĩa tốt nhất, nhưng phức tạp nhất để triển khai.

**Overlapping (Chồng lấn)**: bao gồm cả văn bản từ chunk liền kề — giữ được ngữ cảnh xuyên ranh giới, nhưng tạo ra nhiều chunk hơn để lưu trữ.

Trong SQL Server 2025, đã có sẵn hàm chunking tích hợp: `AI_GENERATE_CHUNKS(SOURCE=@text, CHUNK_TYPE=FIXED, CHUNK_SIZE=500)`.

---

### Slide 7 — Generating & Storing Embeddings

Quy trình tổng quát gồm 5 bước: **Source Data** (dữ liệu nguồn) → **Chunk Text** (chia nhỏ văn bản) → **Generate Embedding** (sinh embedding) → **Store as Vector** (lưu dưới dạng vector) → **Index for Search** (đánh index để tìm kiếm).

Các hàm T-SQL quan trọng: `AI_GENERATE_EMBEDDINGS` — chuyển văn bản thành vector bằng external model; kiểu dữ liệu `VECTOR(1536)` — kiểu vector gốc với kích thước chiều xác định; `VECTOR_DISTANCE` — tính khoảng cách giữa hai vector; `AI_GENERATE_CHUNKS` — chia văn bản dài thành các chunk có thể xử lý.

Ví dụ minh họa: khai báo `DECLARE @emb VECTOR(1536)`, sau đó `SET @emb = AI_GENERATE_EMBEDDINGS(@text USE MODEL EmbedModel)`, rồi `UPDATE Products SET ContentVector = @emb`. Rất đơn giản và gọn gàng — tất cả đều thực hiện ngay trong T-SQL.

---

### Slide 8 — Embedding Maintenance Patterns

Embedding cần luôn đồng bộ với dữ liệu gốc — nếu không, embedding cũ (stale) sẽ trả về kết quả tìm kiếm sai. Có 4 mô hình bảo trì phổ biến:

**Trigger-Based**: tự động sinh lại embedding khi dữ liệu nguồn thay đổi, thông qua DML trigger. Ưu điểm: luôn cập nhật, không có độ trễ. Nhược điểm: tăng latency khi ghi dữ liệu, vì gọi API bên ngoài ngay trong trigger.

**Batch Refresh**: định kỳ sinh lại embedding bằng scheduled job hoặc stored procedure. Ưu điểm: giảm chi phí ghi, gộp các lệnh gọi API theo lô. Nhược điểm: có khoảng trễ (stale window) giữa các lần refresh.

**Change Tracking**: dùng tính năng Change Tracking của SQL để xác định các dòng đã thay đổi, rồi chỉ cập nhật chọn lọc. Ưu điểm: hiệu quả — chỉ cập nhật những dòng thay đổi. Nhược điểm: cần thiết lập Change Tracking trước.

**Lazy / On-Demand**: sinh lại embedding khi dữ liệu được truy cập hoặc truy vấn lần tiếp theo. Ưu điểm: xử lý nền tối thiểu. Nhược điểm: truy vấn đầu tiên sau khi thay đổi sẽ chậm hơn.

---

### Slide 9 — Key Takeaways (Module 1)

Tổng kết Module 1:

`CREATE EXTERNAL MODEL` kết nối SQL với Azure OpenAI — hãy dùng Managed Identity để truy cập an toàn mà không cần mật khẩu.

Chỉ nên embed những cột có ý nghĩa ngữ nghĩa — không phải ID, số liệu, hay mã trạng thái.

Chiến lược chunking phụ thuộc vào loại nội dung — chunk nhỏ cho độ chính xác cao, chunk lớn giữ được ngữ cảnh.

`AI_GENERATE_EMBEDDINGS` kết hợp kiểu dữ liệu `VECTOR(n)` là hai thành phần cốt lõi của embedding trong T-SQL.

Hãy chọn mô hình bảo trì phù hợp dựa trên mức độ chấp nhận dữ liệu cũ so với yêu cầu hiệu năng ghi.

---

### Slide 10 — Module 2: Design & Implement Intelligent Search with SQL

Chuyển sang Module 2: Thiết kế và triển khai tìm kiếm thông minh với SQL — bao gồm full-text search, vector search, và hybrid search, cùng với kỹ thuật Reciprocal Rank Fusion và các đánh đổi về hiệu năng.

---

### Slide 11 — Search Strategy Decision Framework

Đây là khung so sánh giữa ba loại tìm kiếm:

Về tiêu chí khớp: Full-Text Search khớp từ chính xác và biến thể từ (stem); Vector Search khớp theo ý nghĩa ngữ nghĩa; Hybrid Search khớp cả từ khóa lẫn ý nghĩa.

Về khả năng tìm từ đồng nghĩa: Full-Text chỉ làm được nếu có thesaurus; Vector Search làm được tự động; Hybrid Search cũng làm được.

Về khả năng xử lý lỗi chính tả: Full-Text không xử lý được (khớp chính xác); Vector Search xử lý được phần nào nhờ tính tương đồng; Hybrid Search tốt hơn cả hai loại riêng lẻ.

Về tốc độ: Full-Text rất nhanh nhờ inverted index; Vector Search nhanh nhờ vector index; Hybrid Search ở mức trung bình vì phải dùng hai loại index.

Về độ phức tạp thiết lập: Full-Text thấp; Vector Search trung bình; Hybrid Search cao vì cần cả hai cộng với bước fusion.

Về trường hợp phù hợp nhất: Full-Text cho tìm kiếm từ khóa chính xác; Vector Search cho truy vấn ngôn ngữ tự nhiên; Hybrid Search cho hệ thống production.

Hướng dẫn quyết định nhanh: mã SKU sản phẩm hoặc tên chính xác → dùng Full-text; mô tả bằng ngôn ngữ tự nhiên → dùng Vector; thương mại điện tử với hàng triệu sản phẩm → dùng Hybrid; phân tích log mã lỗi → dùng Full-text; tìm ticket hỗ trợ tương tự → dùng Vector; tra cứu tài liệu pháp lý → dùng Hybrid.

---

### Slide 12 — Implementing Full-Text Search

Về các yêu cầu thiết lập Full-Text Search, cần 4 bước: tạo full-text catalog để tổ chức các index; tạo full-text index trên các cột mục tiêu; chỉ định cột khóa duy nhất — thường là primary key; và chọn ngôn ngữ để xử lý ngôn ngữ học (linguistic processing).

Về các hàm truy vấn: `CONTAINS` — khớp từ hoặc cụm từ chính xác, hỗ trợ toán tử AND, OR, NEAR; `FREETEXT` — tìm các kết quả khớp ý nghĩa bằng cách dùng stemming, thesaurus, và các dạng biến thể của từ; `CONTAINSTABLE` — trả về kết quả đã xếp hạng với điểm liên quan dưới dạng bảng; `FREETEXTTABLE` — trả về kết quả xếp hạng theo ý nghĩa dưới dạng bảng.

Mẹo cần nhớ: `CONTAINS` dùng cho khớp từ chính xác, `FREETEXT` dùng cho khớp ý nghĩa. Hãy nắm rõ khi nào dùng từng loại, cùng với các biến thể TABLE để lấy kết quả có xếp hạng.

---

### Slide 13 — Vector Data Types & Index Strategies

Về **kiểu dữ liệu Vector**: kiểu `VECTOR(n)` gốc, với n là số chiều; kích thước phổ biến là 768 hoặc 1536 chiều; số chiều phải khớp với đầu ra của model embedding đang dùng; và được lưu trữ dưới dạng nhị phân để so sánh hiệu quả.

Về **các độ đo khoảng cách (Distance Metrics)**: Cosine đo độ tương đồng về hướng, bỏ qua độ lớn; Euclidean đo khoảng cách tuyệt đối giữa các điểm; Dot Product kết hợp cả hướng và độ lớn.

Về **KNN — Exact Nearest Neighbor**: so sánh brute-force với tất cả vector, cho độ chính xác (recall) 100% — luôn tìm ra nearest neighbor thực sự. Phù hợp cho tập dữ liệu nhỏ, các tình huống yêu cầu độ chính xác cao. Không cần index — quét toàn bộ các dòng.

Về **ANN — Approximate Nearest Neighbor**: tìm kiếm dựa trên index sử dụng thuật toán DiskANN. Đánh đổi một chút độ chính xác để lấy tốc độ vượt trội. Phù hợp cho tập dữ liệu lớn, tìm kiếm production ở quy mô lớn. Cần có vector index — sử dụng đồ thị DiskANN.

---

### Slide 14 — Implementing Vector Search

Có hai cách viết truy vấn vector search.

Cách thứ nhất, dùng `VECTOR_DISTANCE`: ví dụ `SELECT TOP 10 Title, VECTOR_DISTANCE('cosine', Embedding, @qVec) AS dist FROM Documents ORDER BY dist`. Nếu muốn dùng ANN, chỉ cần thêm `WITH APPROXIMATE`.

Cách thứ hai, dùng hàm `VECTOR_SEARCH`: ví dụ `SELECT * FROM VECTOR_SEARCH(TABLE = Documents, COLUMN = Embedding, QUERY_VECTOR = @qVec, TOP_N = 10)`.

Những điểm khác biệt quan trọng cần nhớ: `VECTOR_DISTANCE` trả về một giá trị khoảng cách dạng số; `VECTOR_SEARCH` trả về một bảng gồm các kết quả gần nhất; `WITH APPROXIMATE` sẽ kích hoạt ANN (yêu cầu có index); còn nếu không có `APPROXIMATE`, việc tìm kiếm sẽ dùng KNN (tìm kiếm chính xác).

---

### Slide 15 — Hybrid Search & Reciprocal Rank Fusion

**Hybrid Search** kết hợp hai luồng: **Full-Text Search** (dùng `CONTAINSTABLE` / `FREETEXTTABLE`) và **Vector Search** (dùng `VECTOR_DISTANCE` / `VECTOR_SEARCH`), sau đó đưa qua **Reciprocal Rank Fusion (RRF)** để tạo ra kết quả đã gộp và xếp hạng.

RRF hoạt động như thế nào: nó chuẩn hóa và gộp các kết quả đã xếp hạng từ nhiều phương pháp tìm kiếm khác nhau, mà không cần các điểm số phải có thể so sánh trực tiếp với nhau. Công thức: `RRF Score = Σ 1 / (k + rank_i)` cho mỗi phương pháp tìm kiếm.

Những điểm mạnh của RRF: không cần chuẩn hóa các thang điểm khác nhau; phạt các mục có thứ hạng thấp ở bất kỳ phương pháp nào; thưởng cho các mục có thứ hạng cao đồng nhất qua nhiều phương pháp; và tham số k (thường là 60) kiểm soát độ nhạy của thứ hạng.

---

### Slide 16 — Evaluating Search Performance

Bốn tiêu chí quan trọng để đánh giá hiệu năng tìm kiếm:

**Recall (độ bao phủ)**: bao nhiêu phần trăm tài liệu liên quan đã được tìm thấy? KNN cho recall 100%. ANN đánh đổi một chút recall để lấy tốc độ.

**Precision (độ chính xác)**: trong số kết quả trả về, bao nhiêu là thực sự liên quan? Hybrid search thường cải thiện precision.

**Latency (độ trễ)**: kết quả trả về nhanh đến mức nào? ANN với DiskANN index nhanh hơn KNN nhiều bậc ở quy mô lớn.

**Index Overhead (chi phí index)**: vector index tiêu tốn bộ nhớ và dung lượng lưu trữ. Cần cân bằng giữa yêu cầu recall và chi phí tài nguyên.

Mẹo cần nhớ: hiểu rõ sự đánh đổi — ANN nhanh hơn nhưng recall khoảng 95%; KNN chậm hơn nhưng recall 100%. Hybrid kết hợp RRF mang lại độ liên quan tốt nhất.

---

### Slide 17 — Key Takeaways (Module 2)

Tổng kết Module 2:

Full-text search vượt trội với từ khóa chính xác; vector search xử lý ý nghĩa ngữ nghĩa; hybrid kết hợp cả hai.

`VECTOR_DISTANCE` trả về một giá trị vô hướng; `VECTOR_SEARCH` trả về một bảng — cần biết khi nào dùng loại nào.

KNN cho recall 100%, brute-force; ANN cho recall khoảng 95%, dùng DiskANN index để tăng tốc ở quy mô lớn.

`WITH APPROXIMATE` là từ khóa T-SQL để chuyển từ tìm kiếm chính xác (exact) sang ANN.

Reciprocal Rank Fusion (RRF) gộp các thứ hạng mà không cần chuẩn hóa điểm số — rất cần thiết cho hybrid search.

Cosine distance là độ đo phổ biến nhất cho text embedding; cần nắm rõ cả ba loại độ đo.

---

### Slide 18 — Module 3: Design & Implement RAG with SQL

Chuyển sang Module 3, phần cuối cùng: Thiết kế và triển khai RAG với SQL. Chúng ta sẽ tìm hiểu quy trình 5 bước của Retrieval-Augmented Generation, được xây dựng hoàn toàn bằng T-SQL.

---

### Slide 19 — When to Use RAG

**Nên dùng RAG khi**: xây dựng chatbot hỗ trợ khách hàng — câu trả lời dựa trên chính knowledge base của bạn; hệ thống FAQ nội bộ — phản hồi trích dẫn từ tài liệu công ty cụ thể; gợi ý sản phẩm — giải thích LÝ DO dựa trên dữ liệu sản phẩm thực tế; tóm tắt báo cáo — tóm tắt dữ liệu THẬT của bạn, không phải dữ liệu tưởng tượng; trợ lý review code — đánh giá dựa trên tiêu chuẩn coding của CHÍNH bạn.

**Không nên dùng RAG khi**: chỉ là tra cứu đơn giản — ví dụ "email của khách hàng 42 là gì?" thì chỉ cần dùng SELECT; các phép tổng hợp — ví dụ "tổng doanh số tháng này" thì dùng SUM, không cần RAG; các quyết định thời gian thực — những luồng xử lý cần độ trễ tính bằng mili-giây thì RAG sẽ làm tăng latency; và khi không có dữ liệu liên quan — nếu database của bạn không có câu trả lời thì RAG cũng không giúp được gì.

Mẹo quan trọng: nếu "dữ liệu thay đổi thường xuyên" → dùng RAG, không dùng fine-tuning. RAG sử dụng dữ liệu hiện tại tại thời điểm truy vấn, trong khi fine-tuning sẽ "đóng băng" dữ liệu cũ vào trong model.

---

### Slide 20 — The RAG Pipeline in T-SQL

Quy trình RAG gồm 5 bước:

Bước 1 — **Retrieve (Truy xuất)**: tìm kiếm vector để lấy dữ liệu liên quan về mặt ngữ nghĩa từ database.

Bước 2 — **Format (Định dạng)**: chuyển kết quả SQL thành cấu trúc JSON để LLM có thể sử dụng.

Bước 3 — **Prompt (Xây dựng prompt)**: kết hợp system instruction, context, và câu hỏi của người dùng.

Bước 4 — **Generate (Sinh câu trả lời)**: gọi endpoint LLM thông qua `sp_invoke_external_rest_endpoint`.

Bước 5 — **Extract (Trích xuất)**: phân tích JSON trả về và lấy ra câu trả lời đã được "ground" (dựa trên dữ liệu thật).

Tại sao nên làm RAG ngay trong SQL? Thứ nhất, câu trả lời có căn cứ (Grounded Answers) — phản hồi của LLM dựa trên dữ liệu thực tế của bạn, giảm thiểu hiện tượng "ảo giác" (hallucination). Thứ hai, không cần di chuyển dữ liệu — AI làm việc trực tiếp với dữ liệu trong SQL, không cần ETL sang hệ thống khác. Thứ ba, bảo mật được giữ nguyên — các cơ chế RLS, phân quyền, mã hóa hiện có vẫn áp dụng cho ngữ cảnh mà AI truy xuất.

---

### Slide 21 — Step 1: Retrieve Relevant Context

Bước đầu tiên là truy xuất ngữ cảnh liên quan.

Đầu tiên, chúng ta embed câu hỏi của người dùng: khai báo `DECLARE @qVec VECTOR(1536)`, sau đó `SET @qVec = AI_GENERATE_EMBEDDINGS(@question USE MODEL EmbedModel)`.

Sau đó, thực hiện vector search để tìm tài liệu liên quan: `SELECT TOP 5 Title, Content, VECTOR_DISTANCE('cosine', Embedding, @qVec) AS dist INTO #Context FROM KnowledgeBase`.

Điều gì đang diễn ra ở đây: thứ nhất, câu hỏi của người dùng được chuyển thành vector embedding; thứ hai, `VECTOR_DISTANCE` tìm ra 5 tài liệu tương đồng nhất; thứ ba, kết quả được lưu vào bảng tạm để dùng cho bước tiếp theo.

Chất lượng truy xuất rất quan trọng: LLM chỉ có thể làm việc với ngữ cảnh mà bạn cung cấp. Nếu bước truy xuất trả về tài liệu không liên quan, câu trả lời sinh ra sẽ kém — dù prompt có hoàn hảo đến đâu. Vì vậy, nên dùng hybrid search kết hợp RRF để đạt chất lượng truy xuất tốt nhất trong các hệ thống RAG production.

---

### Slide 22 — Steps 2 & 3: Format Context & Build Prompt

Bước 2 — Chuyển đổi sang JSON: khai báo `DECLARE @ctx NVARCHAR(MAX)`, sau đó dùng `JSON_ARRAYAGG(JSON_OBJECT('title': Title, 'content': Content)) FROM #Context` để gán vào biến `@ctx`.

Bước 3 — Xây dựng prompt: dùng `JSON_OBJECT('messages': JSON_ARRAY(JSON_OBJECT('role': 'system', 'content': @sysMsg), JSON_OBJECT('role': 'user', 'content': @question)))`.

Về cấu trúc prompt, gồm 3 phần: **System Message** — chứa các chỉ dẫn và rào chắn (guardrail), ví dụ: "Chỉ trả lời dựa trên ngữ cảnh được cung cấp. Nếu ngữ cảnh không chứa câu trả lời, hãy nói rõ điều đó." **Context Injection** — là kết quả tìm kiếm đã định dạng JSON từ Bước 2, đây chính là phần giúp "ground" phản hồi của LLM. **User Message** — câu hỏi gốc của người dùng, LLM sẽ kết hợp phần này với ngữ cảnh để sinh ra câu trả lời có căn cứ.

---

### Slide 23 — Steps 4 & 5: Call LLM & Extract Response

Bước 4 — Gọi model: khai báo `DECLARE @response NVARCHAR(MAX)`, sau đó gọi `EXEC sp_invoke_external_rest_endpoint @url = '...', @method = 'POST', @payload = @requestBody, @response = @response OUTPUT`.

Bước 5 — Trích xuất câu trả lời: dùng `SELECT JSON_VALUE(@response, '$.result.choices[0].message.content') AS Answer` để lấy nội dung câu trả lời từ JSON trả về.

Các khái niệm cốt lõi: `sp_invoke_external_rest_endpoint` là stored procedure T-SQL dùng để gọi các REST API bên ngoài — đây chính là cách SQL "nói chuyện" với Azure OpenAI. `JSON_VALUE` dùng để trích xuất — điều hướng qua JSON response lồng nhau để lấy ra văn bản do LLM sinh ra. Về xử lý lỗi: luôn bọc trong `TRY...CATCH` vì các lệnh gọi API bên ngoài có thể thất bại do giới hạn tốc độ (rate limit), timeout, hoặc sự cố dịch vụ.

---

### Slide 24 — Key Takeaways (Module 3)

Tổng kết Module 3:

RAG = Truy xuất (Retrieve) dữ liệu liên quan + Bổ sung (Augment) prompt với ngữ cảnh + Sinh (Generate) câu trả lời có căn cứ.

Dùng RAG khi dữ liệu thay đổi thường xuyên; chỉ dùng fine-tuning khi dữ liệu ổn định và mang tính chuyên biệt theo lĩnh vực.

`sp_invoke_external_rest_endpoint` là cầu nối giữa T-SQL và các API LLM bên ngoài.

Các hàm JSON (`JSON_OBJECT`, `JSON_ARRAY`, `JSON_ARRAYAGG`, `JSON_VALUE`) là thiết yếu cho RAG.

Luôn hướng dẫn LLM chỉ trả lời dựa trên ngữ cảnh được cung cấp — điều này giúp ngăn chặn hiện tượng ảo giác (hallucination).

Chất lượng truy xuất quyết định chất lượng của RAG — hãy đầu tư vào hybrid search kết hợp RRF cho hệ thống production.

---

### Slide 25 — The Complete Picture

Đây là bức tranh tổng thể kết nối cả ba module:

**Models & Embeddings**: `CREATE EXTERNAL MODEL`, chiến lược chunking, `AI_GENERATE_EMBEDDINGS`, kiểu dữ liệu `VECTOR(n)`, và các mô hình bảo trì.

**Intelligent Search**: Full-text với `CONTAINS` / `FREETEXT`, Vector với `VECTOR_DISTANCE`, ANN so với KNN (dùng DiskANN index), hybrid search, và Reciprocal Rank Fusion.

**RAG with SQL**: quy trình Retrieve → Format → Prompt, các hàm định dạng JSON, `sp_invoke_external_rest_endpoint`, thông điệp system và user, và trích xuất phản hồi.

Ba module này kết hợp với nhau tạo thành một hệ thống AI hoàn chỉnh, chạy toàn bộ ngay trong SQL.

---

### Slide 26 — References

Hai đường link quan trọng các bạn nên lưu lại:

Thứ nhất, trang chứng chỉ DP-800 chính thức trên Microsoft Learn.

Thứ hai, loạt video cộng đồng trên Microsoft Reactor — series "Data Days: The SQL AI Series".

---

### Slide 27 — Thank you, crew!

Cảm ơn các bạn đã theo dõi buổi chia sẻ hôm nay! Giờ đây các bạn đã có đủ kỹ năng để đưa embeddings, tìm kiếm thông minh, và RAG vào các giải pháp SQL của mình — hãy bắt tay vào xây dựng một điều gì đó thật tuyệt vời. Hẹn gặp lại các bạn ở phần cuối cùng của series!
