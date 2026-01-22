import pyodbc


try:
    # Thử kết nối với localhost
    conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=NguoiDungSQL;Trusted_Connection=yes'
    conn = pyodbc.connect(conn_str)
    print("Kết nối localhost thành công!")
    conn.close()
except Exception as e:
    print(f"Lỗi kết nối localhost: {e}")