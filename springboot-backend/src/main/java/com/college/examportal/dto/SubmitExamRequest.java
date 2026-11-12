package com.college.examportal.dto;

import java.util.Map;

/** answers: questionId -> selected option key ("a" | "b" | "c" | "d") */
public record SubmitExamRequest(Map<Long, String> answers) {}
