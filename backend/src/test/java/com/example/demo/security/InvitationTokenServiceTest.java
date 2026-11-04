package com.example.demo.security;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class InvitationTokenServiceTest {

    private final InvitationTokenService service = new InvitationTokenService();

    @Test
    void tokensAreUrlSafeAndAtLeast128Bits() {
        String token = service.generate();
        // 32 byte -> 43 karakter URL-safe Base64 (dolgusuz) = 256 bit
        assertThat(token).hasSize(43).matches("[A-Za-z0-9_-]+");
    }

    @Test
    void tokensAreUnique() {
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            tokens.add(service.generate());
        }
        assertThat(tokens).hasSize(1000);
    }

    @Test
    void hashIsDeterministicSha256Hex() {
        assertThat(service.hash("abc"))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
                .isEqualTo(service.hash("abc"));
    }
}
