package com.example.demo.security;

import com.example.demo.config.InvitationProperties;
import com.example.demo.exception.RateLimitExceededException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * NFR-03: Token doğrulayan katılımcı uç noktalarına (/user/**) kaba kuvvet koruması.
 * IP başına dakikalık sabit pencere; tek sunucu için bellekte tutulur.
 * Not: Reverse proxy arkasında gerçek istemci IP'si için server.forward-headers-strategy ayarlanmalıdır.
 */
@Component
public class ParticipantRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final HandlerExceptionResolver resolver;
    private final int limitPerMinute;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public ParticipantRateLimitFilter(
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver,
            InvitationProperties properties
    ) {
        this.resolver = resolver;
        this.limitPerMinute = properties.rateLimitPerMinute();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return limitPerMinute <= 0 || !request.getRequestURI().startsWith("/user/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long minute = System.currentTimeMillis() / 60_000;
        Window window = windows.compute(request.getRemoteAddr(),
                (key, current) -> current == null || current.minute != minute ? new Window(minute) : current);

        if (window.count.incrementAndGet() > limitPerMinute) {
            resolver.resolveException(request, response, null, new RateLimitExceededException());
            return;
        }
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            windows.values().removeIf(w -> w.minute < minute);
        }
        chain.doFilter(request, response);
    }

    private static final class Window {
        private final long minute;
        private final AtomicInteger count = new AtomicInteger();

        private Window(long minute) {
            this.minute = minute;
        }
    }
}
