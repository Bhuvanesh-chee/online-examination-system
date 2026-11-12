package com.college.examportal.service;

import com.college.examportal.dto.ExamStartResponse;
import com.college.examportal.dto.ResultResponse;
import com.college.examportal.entity.*;
import com.college.examportal.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ExamService {

    private final ExamRepository exams;
    private final QuestionRepository questions;
    private final StudentAnswerRepository answers;
    private final ExamResultRepository results;

    public ExamService(ExamRepository exams, QuestionRepository questions,
                       StudentAnswerRepository answers, ExamResultRepository results) {
        this.exams = exams;
        this.questions = questions;
        this.answers = answers;
        this.results = results;
    }

    public List<Exam> activeExams() {
        return exams.findAll().stream().filter(Exam::getActive).toList();
    }

    /** Builds the paper WITHOUT leaking correct answers. */
    public ExamStartResponse startExam(Long examId) {
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> new NoSuchElementException("Examination not found"));

        List<Question> list = questions.findByExamIdOrderByIdAsc(examId);

        List<ExamStartResponse.QuestionView> view = list.stream().map(q -> {
            List<ExamStartResponse.OptionView> opts = q.getOptions().stream()
                    .sorted(Comparator.comparing(Option::getOptionKey))
                    .map(o -> new ExamStartResponse.OptionView(o.getOptionKey(), o.getOptionText()))
                    .toList();
            return new ExamStartResponse.QuestionView(q.getId(), q.getQuestionText(), q.getMarks(), opts);
        }).toList();

        return new ExamStartResponse(exam.getId(), exam.getTitle(), exam.getCode(),
                exam.getDurationMinutes(), exam.getTotalMarks(), exam.getPassingMarks(), view.size(), view);
    }

    /** Grades objective answers server-side and persists attempt + result. */
    @Transactional
    public ResultResponse submitExam(Long studentId, Long examId, Map<Long, String> submitted) {
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> new NoSuchElementException("Examination not found"));
        List<Question> list = questions.findByExamIdOrderByIdAsc(examId);
        if (list.isEmpty()) throw new IllegalStateException("This exam has no questions");

        int attemptNo = (int) results.countByStudentIdAndExamId(studentId, examId) + 1;

        int correct = 0, wrong = 0, unanswered = 0, obtained = 0;
        List<ResultResponse.Review> review = new ArrayList<>();

        for (Question q : list) {
            String selected = submitted == null ? null : submitted.get(q.getId());
            boolean answered = selected != null && !selected.isBlank();
            boolean isCorrect = answered && selected.trim().equalsIgnoreCase(q.getCorrectOption());

            if (!answered) unanswered++;
            else if (isCorrect) { correct++; obtained += q.getMarks(); }
            else wrong++;

            StudentAnswer row = new StudentAnswer();
            row.setStudentId(studentId);
            row.setExamId(examId);
            row.setQuestionId(q.getId());
            row.setSelectedOption(answered ? selected.trim().toLowerCase() : null);
            row.setAttemptNo(attemptNo);
            answers.save(row);

            review.add(new ResultResponse.Review(q.getId(), q.getQuestionText(),
                    row.getSelectedOption(), q.getCorrectOption(), q.getExplanation(), isCorrect));
        }

        int totalMarks = list.stream().mapToInt(Question::getMarks).sum();
        double percentage = totalMarks == 0 ? 0
                : BigDecimal.valueOf(obtained * 100.0 / totalMarks).setScale(2, RoundingMode.HALF_UP).doubleValue();
        String status = obtained >= exam.getPassingMarks() ? "PASS" : "FAIL";

        ExamResult result = new ExamResult();
        result.setStudentId(studentId);
        result.setExamId(examId);
        result.setAttemptNo(attemptNo);
        result.setTotalQuestions(list.size());
        result.setCorrectCount(correct);
        result.setWrongCount(wrong);
        result.setObtainedMarks(obtained);
        result.setTotalMarks(totalMarks);
        result.setPercentage(BigDecimal.valueOf(percentage));
        result.setStatus(status);
        results.save(result);

        return new ResultResponse(result.getId(), examId, exam.getTitle(), attemptNo,
                obtained, totalMarks, percentage, correct, wrong, unanswered, status,
                result.getSubmittedAt() == null ? "" : result.getSubmittedAt().toString(), review);
    }

    /** History is always scoped to the logged-in student id from the session. */
    public List<ExamResult> historyFor(Long studentId) {
        return results.findByStudentIdOrderBySubmittedAtDesc(studentId);
    }
}
