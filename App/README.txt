Để kết nối Flask với SQL Server:
 - Mở SQL Server Configuration Manager
 - Chọn "SQL Server Network Configuration" -> "Protocols for MSSQLSERVER"
 - Enable "Named Pipes" và "TCP/IP"

Trình tự chạy App
 - Khởi động SQL Server
 - Tải Model lên LM Studio và khởi động Server LM Studio ở Developer
 - Chạy BackEnd Flask
 - Chạy FontEnd React