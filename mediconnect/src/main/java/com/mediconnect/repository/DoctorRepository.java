package com.mediconnect.repository;

import com.mediconnect.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    Optional<Doctor> findByUserEmail(String email);
    List<Doctor> findByApprovedTrue();
    List<Doctor> findByApprovedFalse();

    @Query("SELECT d FROM Doctor d WHERE d.approved = true " +
            "AND LOWER(d.fullName) LIKE LOWER(CONCAT('%', :name, '%')) " +
            "AND LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%'))")
    List<Doctor> searchApprovedDoctors(@Param("name") String name, @Param("specialization") String specialization);
}