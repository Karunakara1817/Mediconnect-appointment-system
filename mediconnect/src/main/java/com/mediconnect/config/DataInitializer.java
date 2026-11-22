package com.mediconnect.config;


import com.mediconnect.entity.User;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.util.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDefaultAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            String adminEmail = "admin@mediconnect.com";

            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);

                userRepository.save(admin);
                System.out.println(">>> Default Admin seeded: " + adminEmail + " / Admin@123");
            }
        };
    }
}