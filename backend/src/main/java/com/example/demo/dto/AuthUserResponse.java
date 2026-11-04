package com.example.demo.dto;

import com.example.demo.dao.entity.Role;
import com.example.demo.dao.entity.User;

public record AuthUserResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        String roleDescription
) {

    public static AuthUserResponse from(User user) {
        return new AuthUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getRole().getDescription()
        );
    }
}
