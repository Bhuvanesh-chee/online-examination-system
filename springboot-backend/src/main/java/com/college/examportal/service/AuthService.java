package com.college.examportal.service;

import com.college.examportal.entity.Student;
import com.college.examportal.repository.StudentRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final StudentRepository studentRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    /** Case-insensitive email lookup + BCrypt verification. */
    public Optional<Student> authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) return Optional.empty();
        return studentRepository.findByEmailIgnoreCase(email.trim())
                .filter(student -> encoder.matches(rawPassword, student.getPasswordHash()));
    }

    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }
}
