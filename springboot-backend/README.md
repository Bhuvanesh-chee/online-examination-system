# Online Java & DSA Examination Portal — Spring Boot + MySQL backend

**Project ID:** 2500030116 · **Student:** GAGIREDDY RAMREDDY · B.Tech CSE
Demo login: `GAGIREDDYRAMREDDY@gmail.com` / `123456`

This folder is the **Java backend** deliverable. The running live demo of the same
application is the Next.js app in the repository root (same exam content, same rules).

---

## 1. Requirements
* JDK 17+
* Maven 3.9+ (bundled with IntelliJ / can be installed in Eclipse)
* MySQL 8

## 2. Create the database
```bash
mysql -u root -p < database/schema.sql     # tables, PKs, FKs, unique constraints
mysql -u root -p < database/seed.sql       # demo student + 2 exams + 30 MCQs + 120 options
```
`schema.sql` creates database `exam_portal` with the six required tables:
students, exams, questions, options, student_answers, exam_results.

## 3. Configure credentials
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

## 4. Run

**IntelliJ IDEA**
1. `File → Open…` → select the `springboot-backend` folder (Maven auto-imports).
2. Wait for dependencies, then run `ExamPortalApplication`.
3. API is on `http://localhost:8080`.

**Eclipse (STS / Enterprise Java)**
1. `File → Import → Existing Maven Projects` → select `springboot-backend`.
2. Right-click the project → `Run As → Spring Boot App` (or `Java Application` → `ExamPortalApplication`).

**CLI**
```bash
mvn spring-boot:run
# or
mvn clean package && java -jar target/examportal-1.0.0.jar
```

## 5. REST API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | `{email,password}` → session cookie + student profile |
| GET | `/api/auth/me` | current session student |
| POST | `/api/auth/logout` | invalidate session |
| GET | `/api/exams` | available exams + attempt count for the student |
| GET | `/api/exams/{id}/start` | paper **without** answer keys, with duration |
| POST | `/api/exams/{id}/submit` | `{"answers":{"12":"b"}}` → graded result + review |
| GET | `/api/results` | this student's history only |
| GET | `/api/results/{id}` | one result, ownership-checked |

## 6. Security implemented
* BCrypt hashing (`spring-security-crypto`) — no plain-text passwords anywhere.
* Session-based auth; the student id is read **from the session**, never from the request body,
  so a student cannot submit or read on behalf of someone else.
* Answer keys are excluded from `/start`; grading happens on the server in `ExamService`.
* `student_answers` and `exam_results` carry unique constraints
  `(student_id, exam_id, question_id, attempt_no)` / `(student_id, exam_id, attempt_no)`,
  which prevents duplicate submissions at the database level.
* Bean Validation on login input; typed error responses (401 / 404 / 400).

## 7. Structure
```
springboot-backend/
├── pom.xml
├── database/schema.sql · database/seed.sql      (MySQL DDL + demo data)
└── src/main/
    ├── java/com/college/examportal/
    │   ├── ExamPortalApplication.java
    │   ├── entity/       Student, Exam, Question, Option, StudentAnswer, ExamResult
    │   ├── repository/   Spring Data JPA interfaces
    │   ├── service/      AuthService, ExamService (grading logic)
    │   ├── controller/   AuthController, ExamController, ResultController
    │   ├── dto/          LoginRequest, ExamStartResponse, ResultResponse, SubmitExamRequest
    │   └── config/       WebConfig (CORS for the JS frontend)
    └── resources/application.properties
```
