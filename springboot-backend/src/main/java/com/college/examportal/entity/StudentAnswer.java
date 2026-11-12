package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity @Table(name = "student_answers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id","exam_id","question_id","attempt_no"}))
@Getter @Setter @NoArgsConstructor
public class StudentAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(name = "question_id", nullable = false) private Long questionId;
    @Column(name = "selected_option", length = 1) private String selectedOption;
    @Column(name = "attempt_no", nullable = false) private Integer attemptNo = 1;
    @Column(name = "answered_at") private LocalDateTime answeredAt = LocalDateTime.now();
}
