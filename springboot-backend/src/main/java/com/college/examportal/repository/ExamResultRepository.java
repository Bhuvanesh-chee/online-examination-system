package com.college.examportal.repository;

import com.college.examportal.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByStudentIdOrderBySubmittedAtDesc(Long studentId);
    long countByStudentIdAndExamId(Long studentId, Long examId);
    List<ExamResult> findByStudentIdAndExamIdOrderByAttemptNoDesc(Long studentId, Long examId);
}
