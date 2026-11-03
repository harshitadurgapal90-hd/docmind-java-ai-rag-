package dockmind_backend.example.dockmind.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatResponseDto {

    @NotBlank(message = "Question cannot be empty")
    private String answer;
    private String conversationId;
    private List<CitationDto> citations; // matched document which fetcegd is mapped to this
    private Long responseTimeMs;
}
