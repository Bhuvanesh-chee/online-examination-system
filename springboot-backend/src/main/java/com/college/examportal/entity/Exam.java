package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

@Entity @Table(name = "exams")
@Getter @Setter @NoArgsConstructor
public class Exam {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String title;
    @Column(nullable = false, unique = true) private String code;
    @Column(name = "duration_minutes", nullable = false) private Integer durationMinutes = 20;
    @Column(name = "total_marks", nullable = false) private Integer totalMarks = 15;
    @Column(name = "passing_marks", nullable = false) private Integer passingMarks = 9;
    @Column(nullable = false) private Boolean active = true;
}
