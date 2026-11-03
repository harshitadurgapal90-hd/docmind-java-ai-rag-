package dockmind_backend.example.dockmind.repository;

import dockmind_backend.example.dockmind.entity.DocumentMetadata;
import dockmind_backend.example.dockmind.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();
    List<DocumentMetadata> findByStatus(DocumentStatus status);
}
