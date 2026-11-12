package com.college.examportal.dto;

import java.util.List;

public record ExamStartResponse(Long examId, String title, String code, int durationMinutes,
                                int totalMarks, int passingMarks, int questionCount,
                                List<QuestionView> questions) {

    /** Deliberately omits the correct option and explanation. */
    public record QuestionView(Long id, String questionText, int marks, List<OptionView> options) {}
    public record OptionView(String key, String text) {}
}
