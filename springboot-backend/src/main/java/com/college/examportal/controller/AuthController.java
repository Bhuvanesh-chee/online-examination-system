package com.college.examportal.controller;

import com.college.examportal.dto.LoginRequest;
import com.college.examportal.entity.Student;
import com.college.examportal.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        Optional<Student> student = authService.authenticate(request.email(), request.password());
        if (student.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
        session.setAttribute("STUDENT_ID", student.get().getId());
        session.setMaxInactiveInterval(45 * 60);
        return ResponseEntity.ok(profile(student.get()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object id = session.getAttribute("STUDENT_ID");
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not logged in"));
        return ResponseEntity.ok(Map.of("studentId", id));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> profile(Student s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("name", s.getName());
        map.put("email", s.getEmail());
        map.put("rollNo", s.getRollNo());
        map.put("department", s.getDepartment());
        return map;
    }
}
