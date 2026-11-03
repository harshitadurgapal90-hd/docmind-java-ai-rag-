package dockmind_backend.example.dockmind.dto;

import dockmind_backend.example.dockmind.entity.DocumentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocumentMetadataDto {  // same as document metadata

    private UUID id;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private Integer totalPages;
    private Integer totalChunks;
    private DocumentStatus status;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
