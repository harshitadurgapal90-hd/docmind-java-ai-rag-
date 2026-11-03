package dockmind_backend.example.dockmind.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ApiResponse(
        boolean success,
        String message,
        Object data,
        LocalDateTime timestamp
) {
}
