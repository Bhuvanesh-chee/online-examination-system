package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "exam_results",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id","exam_id","attempt_no"}))
@Getter @Setter @NoArgsConstructor
public class ExamResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(name = "attempt_no", nullable = false) private Integer attemptNo = 1;
    @Column(name = "total_questions", nullable = false) private Integer totalQuestions;
    @Column(name = "correct_count", nullable = false) private Integer correctCount;
    @Column(name = "wrong_count", nullable = false) private Integer wrongCount;
    @Column(name = "obtained_marks", nullable = false) private Integer obtainedMarks;
    @Column(name = "total_marks", nullable = false) private Integer totalMarks;
    @Column(nullable = false) private BigDecimal percentage;
    @Column(nullable = false) private String status;   // PASS / FAIL
    @Column(name = "submitted_at") private LocalDateTime submittedAt = LocalDateTime.now();
}
