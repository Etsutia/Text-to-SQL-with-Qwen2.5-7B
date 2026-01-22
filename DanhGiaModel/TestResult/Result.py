
import os
import json
import pandas as pd
import requests
import re

# === CẤU HÌNH ===
CSV_FILE = "test.csv"         # Đường dẫn tới file CSV test
SCHEMA_DIR = "database"        # Thư mục chứa các thư mục con có schema.sql
OUTPUT_FILE = "predict.txt"   # File kết quả đầu ra chỉ chứa SQL
API_URL = "http://localhost:1234/v1/chat/completions"  # API của LM Studio
MODEL_ID = "qwen2.5-7b-instruct"  # ID của model đã tải trong LM Studio

# === ĐỌC DỮ LIỆU CSV ===
df = pd.read_csv(CSV_FILE)
sql_results = []

for idx, row in df.iterrows():
    db_id = row['db_id']
    question = row['question']
    schema_path = os.path.join(SCHEMA_DIR, db_id, "schema.sql")

    if not os.path.exists(schema_path):
        print(f"[❌] Không tìm thấy schema cho '{db_id}'")
        continue

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # === TẠO PROMPT ===
    prompt = f"""### SQLite Schema:
```sql
{schema_sql}
```

### Question:
{question}

### SQL Query (only provide the SQL statement, no explanation):
"""

    # === CẤU HÌNH PAYLOAD ===
    payload = {
        "model": MODEL_ID,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 512,
        "stream": False
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=60)
        if response.status_code == 200:
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0 and 'message' in result['choices'][0]:
                output = result['choices'][0]['message']['content']
                sql_match = re.search(r"```sql\n(.*?)```", output, re.DOTALL)
                if sql_match:
                    sql_result = sql_match.group(1).strip()
                else:
                    sql_result = output.strip()

                # Ghi mỗi câu SQL ra một dòng
                sql_results.append(sql_result)
                print(f"[✅] Q{idx+1}: OK")
            else:
                print(f"[⚠️] Q{idx+1}: Phản hồi sai định dạng")
        else:
            print(f"[❌] Q{idx+1}: API lỗi {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[❌] Q{idx+1}: Lỗi kết nối - {e}")

# === GHI RA FILE (chỉ câu lệnh SQL, mỗi dòng 1 câu) ===
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    for sql in sql_results:
        f.write(sql + "\n")

print(f"\n✅ Đã ghi tất cả câu lệnh SQL vào '{OUTPUT_FILE}'")