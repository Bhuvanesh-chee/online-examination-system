package com.college.examportal.repository;

import com.college.examportal.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findByStudentIdAndExamIdAndAttemptNo(Long studentId, Long examId, Integer attemptNo);
}
