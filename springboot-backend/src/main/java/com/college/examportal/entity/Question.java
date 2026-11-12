package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "questions")
@Getter @Setter @NoArgsConstructor
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    /** Never expose this to the browser before submission. */
    @Column(name = "correct_option", nullable = false)
    private String correctOption;

    @Column(nullable = false) private Integer marks = 1;
    @Column(columnDefinition = "TEXT") private String explanation;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Option> options = new ArrayList<>();
}
