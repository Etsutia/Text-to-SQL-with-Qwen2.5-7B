# 🛢️ XÂY DỰNG ỨNG DỤNG CHUYỂN ĐỔI NGÔN NGỮ TỰ NHIÊN SANG NGÔN NGỮ TRUY VẤN DQL
(Text-to-DQL using Large Language Model – Qwen2.5 7B)
------------------------------------------------

## 👋 Giới thiệu

Dự án này được xây dựng trong khuôn khổ khóa luận tốt nghiệp ngành Công nghệ thông tin trường Đại học Quốc Tế Hồng Bàng.

Mục tiêu của hệ thống là:

- Hỗ trợ người dùng không có kiến thức SQL/DQL vẫn có thể truy vấn dữ liệu.
  
- Chuyển đổi câu hỏi ngôn ngữ tự nhiên → câu truy vấn DQL sử dụng mô hình ngôn ngữ lớn (LLM) Qwen2.5 7B.
  
- Tinh chỉnh mô hình Qwen2.5 7B trên Spider dataset để nâng cao khả năng hiểu cấu trúc CSDL và sinh câu truy vấn chính xác.

Ứng dụng cung cấp giao diện web thân thiện, dễ dùng, gồm chức năng truy vấn, xem lịch sử, báo cáo truy vấn và trang quản trị người dùng.

------------------------------------------------

## ⭐ Tính năng chính


- Chuyển đổi ngôn ngữ tự nhiên → DQL.

- Hỗ trợ nhiều dạng câu hỏi: thống kê, lọc dữ liệu, liên kết bảng, truy vấn nhóm...

- Lưu lịch sử truy vấn & xem lại.

- Báo cáo câu truy vấn sai.

- Quản trị người dùng và truy vấn.

- Chạy mô hình AI cục bộ qua LM Studio Server (không cần kết nối cloud).
------------------------------------------------

## 🏗 Kiến trúc hệ thống

```
ReactJS (Frontend)  
       |
Flask API (Backend)  
       |
Qwen2.5 7B (Fine-tuned) — LM Studio Server
       |
Microsoft SQL Server
```
------------------------------------------------

## 🤖 Mô hình ngôn ngữ lớn (LLM) & Kỹ thuật tinh chỉnh

- Mô hình: Qwen2.5 7B (Decoder-only Transformer)

  - Kỹ thuật tinh chỉnh:

  - PEFT

  - LoRA

  - Supervised Fine-Tuning (SFT)

- Dataset: Spider

- Bộ đánh giá:

  - Exact Match (EM)

  - Execution Accuracy (EX)

  - Partial Matching Score
------------------------------------------------

## 🛠 Công nghệ sử dụng

| Thành phần    | Công nghệ                                 |
| ------------- | :-----------------------------------------: |
| Frontend      | ReactJS                                   |
| Backend       | Flask (Python)                            |
| Training      | PyTorch, Transformers, PEFT, Google Colab |
| Model Serving | LM Studio                                 |
| Database      | SQL Server                                |
| Dataset       | Spider                                    |
------------------------------------------------

## 📊 Đánh giá mô hình

Để hiểu rõ hơn về hiệu suất mô hình trên các truy vấn khác nhau, các truy vấn DQL trong tập Spider được chia thành 4 cấp độ: dễ (easy), trung bình (medium), khó (hard), và cực khó (extra hard) theo cách phân chia độ khó chính thức của tập dữ liệu Spider.

Dưới đây là kết quả đánh giá mô hình thông qua 2 phương pháp Exact Matching without Values (EM) without Values và phương pháp Execution Accuracy (EX) để đo lường khả năng tạo ra câu truy vấn SQL của mô hình.

| Độ khó     | Dễ | Trung bình | Khó | Cực khó | Tổng |
|-----------|:----:|:-------------:|:-----:|:----------:|:-------:|
| **Số câu** | 250 | 440 | 173 | 170 | 1033 |
| **EM**     | 0.816 | 0.720 | 0.538 | 0.447 | 0.668 |
| **EX**     | 0.856 | 0.745 | 0.665 | 0.488 | 0.716 |

Để đánh giá hiệu quả của mô hình sau khi được tinh chỉnh, bảng sau trình bày kết quả so sánh giữa mô hình Qwen 2.5 7B được tinh chỉnh trên bộ dữ liêu Spider và mô hình Qwen2.5 7B gốc dựa trên hai chỉ số EM và EX theo từng mức độ khó của truy vấn.

| Độ khó                    | | Dễ   | Trung bình | Khó   | Cực khó | Tổng  |
|-------------------------------------|--------|:------:|:-------------:|:--------:|:----------:|:--------:|
| **Số câu**                          |        | 250  | 440         | 173    | 170      | 1033   |
| **Qwen 2.5 7B đã được tinh chỉnh** | EM     | 0.816 | 0.720 | 0.538 | 0.447 | 0.668 |
|                                     | EX     | 0.856 | 0.745 | 0.665 | 0.488 | 0.716 |
| **Qwen 2.5 7B bản gốc**             | EM     | 0.436 | 0.273 | 0.253 | 0.147 | 0.228 |
|                                     | EX     | 0.438 | 0.302 | 0.310 | 0.188 | 0.317 |


------------------------------------------------

## 🎯 Hướng cải thiện

- Cải thiện hiệu suất với truy vấn phức tạp (nested queries).

- Tích hợp với cơ sở dữ liệu thực tế để thực hiện việc truy xuất thông tin thông qua câu truy vấn đã được tạo bởi mô hình.

- Hiển thị trực quan với biểu đồ phù hợp với dữ liệu trả về từ truy vấn.

- Hỗ trợ truy vấn đa ngôn ngữ.
