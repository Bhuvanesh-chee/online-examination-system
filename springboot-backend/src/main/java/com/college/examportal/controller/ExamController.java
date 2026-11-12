package com.college.examportal.controller;

import com.college.examportal.dto.ExamStartResponse;
import com.college.examportal.entity.Exam;
import com.college.examportal.repository.ExamResultRepository;
import com.college.examportal.service.ExamService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;
    private final ExamResultRepository resultRepository;

    public ExamController(ExamService examService, ExamResultRepository resultRepository) {
        this.examService = examService;
        this.resultRepository = resultRepository;
    }

    private Long requireStudent(HttpSession session) {
        Object id = session.getAttribute("STUDENT_ID");
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        return (Long) id;
    }

    @GetMapping
    public List<Map<String, Object>> list(HttpSession session) {
        Long studentId = requireStudent(session);
        return examService.activeExams().stream().map(e -> Map.<String, Object>of(
                "id", e.getId(),
                "title", e.getTitle(),
                "code", e.getCode(),
                "durationMinutes", e.getDurationMinutes(),
                "totalMarks", e.getTotalMarks(),
                "passingMarks", e.getPassingMarks(),
                "attempts", resultRepository.countByStudentIdAndExamId(studentId, e.getId())
        )).toList();
    }

    @GetMapping("/{id}/start")
    public ExamStartResponse start(@PathVariable Long id, HttpSession session) {
        requireStudent(session);
        return examService.startExam(id);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable Long id,
                                    @RequestBody(required = false) Map<Long, String> answers,
                                    HttpSession session) {
        Long studentId = requireStudent(session);
        try {
            return ResponseEntity.ok(examService.submitExam(studentId, id, answers));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
