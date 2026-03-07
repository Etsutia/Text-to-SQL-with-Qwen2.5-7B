# 🛢️ Application for Converting Natural Language to SQL Queries (Text-to-SQL)
(Text-to-SQL using Large Language Model – Qwen2.5 7B)
------------------------------------------------

## 👋 Introduction

This project was developed as a graduation thesis for the Information Technology program at Hong Bang International University.

The primary objectives of the system are:

- Accessibility: Enabling users without SQL/DQL knowledge to query databases effectively.
  
- AI-Powered Conversion: Converting natural language questions into DQL queries using the Qwen2.5 7B Large Language Model (LLM).
  
- Model Optimization: Fine-tuning the Qwen2.5 7B model on the Spider dataset to enhance its understanding of database schemas and improve query generation accuracy.

The application features a user-friendly web interface including query functions, history tracking, error reporting, and an administrative dashboard for user management.
------------------------------------------------

## ⭐ Key Features


- Natural Language to SQL Conversion: Seamlessly transform human language into structured queries.

- Complex Query Support: Handles various query types, including statistics, data filtering, table joins, and grouping (GROUP BY).

- Query History: Save and review previous search sessions.

- Error Reporting: Users can report inaccurate query generations for further refinement.

- Admin Management: Dedicated tools for managing users and monitoring system queries.

- Local AI Deployment: Runs locally via LM Studio Server, ensuring data privacy and no cloud dependency.
------------------------------------------------

## 🏗 System Architecture

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

## 🤖 LLM & Fine-tuning Techniques

- Model: Qwen2.5 7B (Decoder-only Transformer)

- Fine-tuning Techniques:

  - PEFT (Parameter-Efficient Fine-Tuning)

  - LoRA (Low-Rank Adaptation)

  - SFT (Supervised Fine-Tuning)

- Dataset: Spider

- Evaluation Metrics:

  - Exact Match (EM)

  - Execution Accuracy (EX)

  - Partial Matching Score
------------------------------------------------

## 🛠 Tech Stack

| Component    | Technology                                |
| ------------- | :-----------------------------------------: |
| Frontend      | ReactJS                                   |
| Backend       | Flask (Python)                            |
| Training      | PyTorch, Transformers, PEFT, Google Colab |
| Model Serving | LM Studio                                 |
| Database      | SQL Server                                |
| Dataset       | Spider                                    |
------------------------------------------------

## 📊 Model Evaluation

To provide a comprehensive view of performance, DQL queries in the Spider dataset are categorized into four levels: Easy, Medium, Hard, and Extra Hard, following the official Spider evaluation criteria.

The following table displays the results using Exact Matching without Values (EM) and Execution Accuracy (EX) to measure the model's SQL generation capabilities.

| Difficulty    | Easy | Medium | Hard | Extra Hard | Total |
|-----------|:----:|:-------------:|:-----:|:----------:|:-------:|
| **Count** | 250 | 440 | 173 | 170 | 1033 |
| **EM**     | 0.816 | 0.720 | 0.538 | 0.447 | 0.668 |
| **EX**     | 0.856 | 0.745 | 0.665 | 0.488 | 0.716 |

To evaluate the effectiveness of the fine-tuning process, the table below compares the Fine-tuned Qwen2.5 7B against the Base Qwen2.5 7B model across both EM and EX metrics.
| Difficulty                   | | Easy   | Medium | Hard  | Extra Hard | Total  |
|-------------------------------------|--------|:------:|:-------------:|:--------:|:----------:|:--------:|
| **Count**                          |        | 250  | 440         | 173    | 170      | 1033   |
| **Fine-tuned Qwen 2.5 7B** | EM     | 0.816 | 0.720 | 0.538 | 0.447 | 0.668 |
|                                     | EX     | 0.856 | 0.745 | 0.665 | 0.488 | 0.716 |
| **Base Qwen 2.5 7B**             | EM     | 0.436 | 0.273 | 0.253 | 0.147 | 0.228 |
|                                     | EX     | 0.438 | 0.302 | 0.310 | 0.188 | 0.317 |


------------------------------------------------

## 🎯 Future Roadmap

- Optimization: Improve performance for highly complex nested queries.

- Production Integration: Connect with live production databases for real-time information retrieval.
  
- Data Visualization: Integrate dynamic charts and dashboards to visualize query results.

- Multilingual Support: Expand natural language query capabilities to multiple languages.
