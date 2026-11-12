package com.college.examportal.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter; import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity @Table(name = "students")
@Getter @Setter @NoArgsConstructor
public class Student {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true) private String email;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(name = "roll_no") private String rollNo;
    private String department;
    @Column(name = "created_at") private LocalDateTime createdAt = LocalDateTime.now();
}
