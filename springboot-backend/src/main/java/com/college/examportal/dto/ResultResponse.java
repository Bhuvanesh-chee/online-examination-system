package com.college.examportal.dto;

import java.util.List;

public record ResultResponse(Long resultId, Long examId, String examTitle, int attemptNo,
                             int obtainedMarks, int totalMarks, double percentage,
                             int correctCount, int wrongCount, int unansweredCount,
                             String status, String submittedAt, List<Review> review) {

    public record Review(Long questionId, String questionText, String selectedOption,
                         String correctOption, String explanation, boolean correct) {}
}
