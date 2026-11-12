package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

@Entity @Table(name = "options")
@Getter @Setter @NoArgsConstructor
public class Option {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "option_key", nullable = false) private String optionKey;  // a, b, c, d
    @Column(name = "option_text", nullable = false) private String optionText;
}
