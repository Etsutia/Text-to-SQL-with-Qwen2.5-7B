đầu tiên chạy Result.py để viết file predict.txt các câu truy vấn SQL của mô hình.
Sau đó chạy file evaluation.py với câu lệnh:

 python evaluation.py --gold gold.txt --pred predict.txt --etype all --db database --table tables.json

để đánh giá mô hình theo chuẩn của bộ dữ liệu Spider.
Xem chi tiết ở "https://github.com/taoyds/spider/tree/master/evaluation_examples" 
và "https://github.com/taoyds/test-suite-sql-eval"