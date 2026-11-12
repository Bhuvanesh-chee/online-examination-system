package com.college.examportal.controller;

import com.college.examportal.entity.ExamResult;
import com.college.examportal.service.ExamService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Every query is scoped to the session's student id, so one student can never read another's marks. */
@RestController
@RequestMapping("/api/results")
public class ResultController {

    private final ExamService examService;

    public ResultController(ExamService examService) {
        this.examService = examService;
    }

    private Long requireStudent(HttpSession session) {
        Object id = session.getAttribute("STUDENT_ID");
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        return (Long) id;
    }

    @GetMapping
    public List<ExamResult> myResults(HttpSession session) {
        return examService.historyFor(requireStudent(session));
    }

    @GetMapping("/{resultId}")
    public ExamResult single(@PathVariable Long resultId, HttpSession session) {
        Long studentId = requireStudent(session);
        return examService.historyFor(studentId).stream()
                .filter(r -> r.getId().equals(resultId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Result not found"));
    }
}
